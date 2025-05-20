document.addEventListener('DOMContentLoaded', function() {
    const envelope = document.getElementById('envelope');
    const instructions = document.querySelector('.instructions');
    const shareButton = document.getElementById('shareButton');
    const nextParagraphBtn = document.getElementById('nextParagraphBtn');
    const paragraphCounter = document.getElementById('paragraphCounter');
    let isOpen = false;
    
    // 书籍相关元素
    const bookContainer = document.getElementById('bookContainer');
    const book = document.getElementById('book');
    const bookNavigation = document.getElementById('bookNavigation');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const lastPage = document.getElementById('lastPage');
    const bookSignature = document.getElementById('bookSignature');
    const saveImageBtn = document.getElementById('saveImageBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewClose = document.getElementById('imagePreviewClose');
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    
    // 分段显示相关变量
    let paragraphs = [];
    let currentParagraphIndex = 0;
    let isStepByStep = false;
    let contentElement;
    let signatureElement;
    
    // 书籍相关变量
    let pages = [];
    let currentPage = 0;
    let useBookMode = false;

    // 检查URL参数或LocalStorage中是否有自定义数据
    function getCustomData() {
        // 先检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data');
        const isPreview = urlParams.get('preview') === 'true';
        
        if (dataParam) {
            try {
                return JSON.parse(decodeURIComponent(dataParam));
            } catch (e) {
                console.error('解析URL参数出错', e);
            }
        }
        
        // 如果是预览模式，从localStorage获取数据
        if (isPreview) {
            const storageData = localStorage.getItem('letterData');
            if (storageData) {
                try {
                    return JSON.parse(storageData);
                } catch (e) {
                    console.error('解析localStorage数据出错', e);
                }
            }
        }
        
        // 返回默认值
        return null;
    }

    // 应用自定义数据
    function applyCustomData() {
        const customData = getCustomData();
        
        if (customData) {
            // 检查是否是书籍模式
            useBookMode = customData.bookMode === true;
            
            // 设置信封颜色
            if (customData.color) {
                const envelopeColor = customData.color;
                
                document.querySelector('.front').style.backgroundColor = envelopeColor;
                
                // 设置其他相关元素的颜色
                const darkerColor = adjustColor(envelopeColor, -30);
                const lighterColor = adjustColor(envelopeColor, 20);
                
                document.querySelector('.back').style.backgroundColor = darkerColor;
                document.querySelector('.top-flap').style.backgroundColor = lighterColor;
                document.querySelector('.bottom-flap').style.backgroundColor = lighterColor;
                document.querySelector('.left-flap').style.backgroundColor = lighterColor;
                document.querySelector('.right-flap').style.backgroundColor = lighterColor;
                
                // 设置标题和签名颜色
                document.querySelector('.card-content h2').style.color = envelopeColor;
                document.querySelector('.signature').style.color = envelopeColor;
                
                // 设置书籍元素颜色
                if (useBookMode) {
                    document.documentElement.style.setProperty('--book-color', envelopeColor);
                    document.documentElement.style.setProperty('--book-color-dark', darkerColor);
                    
                    const bookElements = ['.bookmark', '.book-btn', '.book-title', '.page-content h2', '.signature'];
                    bookElements.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => {
                            if (selector === '.book-btn') {
                                el.style.backgroundColor = envelopeColor;
                            } else {
                                el.style.color = envelopeColor;
                            }
                        });
                    });
                }
            }
            
            // 设置收信人
            const recipient = customData.recipient || '亲爱的朋友';
            document.querySelector('.card-content h2').textContent = recipient;
            
            // 存储引用以供后续使用
            contentElement = document.querySelector('.card-content');
            signatureElement = document.querySelector('.signature');
            
            // 检查是否是分段模式
            isStepByStep = customData.stepByStep === true;
            
            // 设置签名
            const signature = customData.signature || '爱你的朋友';
            signatureElement.textContent = signature;
            if (bookSignature) {
                bookSignature.textContent = signature;
            }
            
            // 处理正文内容
            if (customData.paragraphs && Array.isArray(customData.paragraphs)) {
                // 存储段落数据
                paragraphs = customData.paragraphs;
                
                // 清除现有的内容段落
                const existingParagraphs = contentElement.querySelectorAll('p:not(.signature)');
                existingParagraphs.forEach(p => p.remove());
                
                if (useBookMode) {
                    // 书籍模式：准备书籍页面
                    setupBookPages(recipient, paragraphs, signature);
                } else if (isStepByStep) {
                    // 分段模式：只显示第一段
                    if (paragraphs.length > 0) {
                        displayParagraph(0);
                        
                        // 如果有多个段落，显示下一段按钮和计数器
                        if (paragraphs.length > 1) {
                            nextParagraphBtn.style.display = 'block';
                            paragraphCounter.style.display = 'block';
                            updateParagraphCounter();
                        }
                    }
                } else {
                    // 普通模式：显示所有段落
                    paragraphs.forEach(paragraph => {
                        const p = document.createElement('p');
                        p.textContent = paragraph;
                        contentElement.insertBefore(p, signatureElement);
                    });
                }
            } else if (customData.message) {
                // 兼容旧版数据格式
                // 清除现有的内容段落
                const contentElement = document.querySelector('.card-content');
                const paragraphs = contentElement.querySelectorAll('p:not(.signature)');
                paragraphs.forEach(p => p.remove());
                
                // 在标题和签名之间添加新内容
                const messageLines = customData.message.split('\n');
                const h2Element = contentElement.querySelector('h2');
                const signatureElement = contentElement.querySelector('.signature');
                
                messageLines.forEach(line => {
                    if (line.trim() === '') {
                        return; // 跳过空行
                    }
                    const p = document.createElement('p');
                    p.textContent = line;
                    contentElement.insertBefore(p, signatureElement);
                });
            }
            
            // 如果是预览模式且设置了自动打开
            if (customData.preview && customData.autoOpen) {
                setTimeout(() => {
                    openEnvelope();
                }, 1000);
            }
        }
    }
    
    // 设置书籍页面
    function setupBookPages(recipient, paragraphs, signature) {
        // 创建页面内容 - 每页只在正面显示一个段落
        const totalPages = paragraphs.length;
        console.log(`总段落数: ${paragraphs.length}, 总页数: ${totalPages}`);
        
        for (let i = 0; i < totalPages; i++) {
            const page = document.createElement('div');
            page.className = 'page';
            page.style.zIndex = 100 - i;
            page.dataset.index = i;
            
            // 添加页面阴影层
            const pageShadow = document.createElement('div');
            pageShadow.className = 'page-shadow';
            page.appendChild(pageShadow);
            
            const pageContent = document.createElement('div');
            pageContent.className = 'page-content';
            
            // 创建页面正面 - 只使用正面显示内容
            const pageFront = document.createElement('div');
            pageFront.className = 'page-front';
            pageFront.style.width = '100%'; // 正面占据整个宽度
            
            // 添加页码
            const pageFrontNumber = document.createElement('div');
            pageFrontNumber.className = 'page-number';
            pageFrontNumber.textContent = i + 1;
            pageFront.appendChild(pageFrontNumber);
            
            // 每页都添加收信人标题
            const frontTitle = document.createElement('h2');
            frontTitle.textContent = recipient;
            frontTitle.style.marginBottom = '25px';
            pageFront.appendChild(frontTitle);
            
            // 添加内容
            const paragraph = document.createElement('p');
            paragraph.textContent = paragraphs[i];
            pageFront.appendChild(paragraph);
            console.log(`页面 ${i+1} 内容: ${paragraphs[i].substring(0, 20)}...`);
            
            // 如果是最后一页，添加签名
            if (i === paragraphs.length - 1) {
                const signatureEl = document.createElement('p');
                signatureEl.className = 'signature';
                signatureEl.textContent = signature;
                pageFront.appendChild(signatureEl);
                console.log('添加签名到最后一页');
            }
            
            // 添加装饰
            const decoration = document.createElement('div');
            decoration.className = 'page-decoration top-left';
            pageFront.appendChild(decoration);
            
            // 添加波浪装饰
            const wave = document.createElement('div');
            wave.className = 'wave-decoration';
            pageFront.appendChild(wave);
            
            // 组装页面 - 只添加正面
            pageContent.appendChild(pageFront);
            page.appendChild(pageContent);
            
            // 添加到DOM
            book.appendChild(page);
            pages.push(page);
        }
        
        // 更新最后一页
        lastPage.style.display = 'flex';
        
        // 为每个页面添加事件
        pages.forEach((page, index) => {
            // 添加点击事件
            page.addEventListener('click', function() {
                flipPage(this);
            });
            
            // 添加3D悬停效果
            page.addEventListener('mousemove', function(e) {
                if (!this.classList.contains('flipped')) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left; // x在元素内的位置
                    const y = e.clientY - rect.top;  // y在元素内的位置
                    
                    // 计算旋转角度，最大5度
                    const rotateY = ((x / rect.width) - 0.5) * 5;
                    const rotateX = ((y / rect.height) - 0.5) * -3;
                    
                    // 应用3D转换
                    this.style.transform = `perspective(1500px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
                } else {
                    this.style.transform = 'rotateY(-180deg)';
                }
            });
            
            // 移出时恢复正常
            page.addEventListener('mouseleave', function() {
                if (!this.classList.contains('flipped')) {
                    this.style.transform = '';
                } else {
                    this.style.transform = 'rotateY(-180deg)';
                }
            });
        });
        
        // 更新导航按钮
        updateBookNavigation();
    }
    
    // 翻页效果
    function flipPage(page) {
        if (!page) return;
        
        const index = parseInt(page.dataset.index);
        const isFlipped = page.classList.contains('flipped');
        
        // 播放翻页声音
        playPageTurnSound();
        
        console.log(`翻页: 页面索引 ${index}, 当前状态: ${isFlipped ? '已翻过' : '未翻过'}`);
        
        if (isFlipped) {
            // 如果翻回去，只翻当前这一页
            page.classList.remove('flipped');
            setTimeout(() => {
                page.style.transform = '';
            }, 50);
            currentPage = index;
        } else {
            // 如果翻过去，只翻当前这一页
            page.classList.add('flipped');
            currentPage = index + 1;
        }
        
        updateBookNavigation();
    }
    
    // 切换到上一页
    function prevPage() {
        if (currentPage > 0) {
            playPageTurnSound();
            pages[currentPage - 1].classList.remove('flipped');
            pages[currentPage - 1].style.transform = '';
            currentPage--;
            updateBookNavigation();
        }
    }
    
    // 切换到下一页
    function nextPage() {
        if (currentPage < pages.length) {
            playPageTurnSound();
            pages[currentPage].classList.add('flipped');
            currentPage++;
            updateBookNavigation();
        }
    }
    
    // 更新书籍导航按钮状态
    function updateBookNavigation() {
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage >= pages.length;
        
        // 额外显示日志，帮助调试
        console.log(`当前页面索引: ${currentPage}, 总页数: ${pages.length}`);
    }
    
    // 显示指定的段落(原分段模式使用)
    function displayParagraph(index) {
        if (index < 0 || index >= paragraphs.length || !contentElement || !signatureElement) return;
        
        // 移除当前显示的临时段落
        const tempParagraphs = contentElement.querySelectorAll('.temp-paragraph');
        tempParagraphs.forEach(p => p.remove());
        
        // 创建新段落
        const p = document.createElement('p');
        p.textContent = paragraphs[index];
        p.classList.add('temp-paragraph');
        
        // 添加到DOM
        contentElement.insertBefore(p, signatureElement);
        
        // 更新当前段落索引
        currentParagraphIndex = index;
        
        // 更新计数器
        updateParagraphCounter();
        
        // 如果是最后一段，隐藏下一段按钮
        if (currentParagraphIndex >= paragraphs.length - 1) {
            nextParagraphBtn.style.display = 'none';
        } else {
            nextParagraphBtn.style.display = 'block';
        }
    }
    
    // 更新段落计数器
    function updateParagraphCounter() {
        paragraphCounter.textContent = `第 ${currentParagraphIndex + 1} 段，共 ${paragraphs.length} 段`;
    }
    
    // 调整颜色亮度的辅助函数
    function adjustColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = Math.max(0, Math.min(255, R + percent));
        G = Math.max(0, Math.min(255, G + percent));
        B = Math.max(0, Math.min(255, B + percent));

        const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }

    // 应用自定义数据
    applyCustomData();

    // 信封点击事件
    envelope.addEventListener('click', function() {
        if (!isOpen) {
            openEnvelope();
        } else {
            closeEnvelope();
        }
    });

    // 打开信封函数
    function openEnvelope() {
        envelope.classList.add('open');
        instructions.textContent = '点击信封关闭';
        isOpen = true;
        
        // 如果是书籍模式，显示书籍并隐藏信封
        if (useBookMode && paragraphs.length > 0) {
            setTimeout(() => {
                envelope.style.display = 'none';
                instructions.style.display = 'none';
                bookContainer.style.display = 'block';
                bookNavigation.style.display = 'flex';
            }, 1000);
        }
    }

    // 关闭信封函数
    function closeEnvelope() {
        envelope.classList.remove('open');
        instructions.textContent = '点击信封打开';
        isOpen = false;
        
        // 如果是书籍模式，隐藏书籍并显示信封
        if (useBookMode) {
            bookContainer.style.display = 'none';
            bookNavigation.style.display = 'none';
            envelope.style.display = 'block';
            instructions.style.display = 'block';
        }
    }
    
    // 下一段按钮点击事件(原分段模式使用)
    nextParagraphBtn.addEventListener('click', function() {
        if (currentParagraphIndex < paragraphs.length - 1) {
            displayParagraph(currentParagraphIndex + 1);
        }
    });
    
    // 上一页按钮点击事件
    prevBtn.addEventListener('click', function() {
        prevPage();
    });
    
    // 下一页按钮点击事件
    nextBtn.addEventListener('click', function() {
        nextPage();
    });

    // 保存图片按钮点击事件
    saveImageBtn && saveImageBtn.addEventListener('click', function() {
        generateCompleteImage();
    });
    
    // 图片预览关闭按钮点击事件
    imagePreviewClose && imagePreviewClose.addEventListener('click', function() {
        imagePreviewContainer.style.display = 'none';
    });
    
    // 下载图片按钮点击事件
    downloadImageBtn && downloadImageBtn.addEventListener('click', function() {
        downloadImage();
    });
    
    // 生成完整情书图片
    function generateCompleteImage() {
        // 创建一个临时容器来放置完整内容
        const tempContainer = document.createElement('div');
        tempContainer.style.width = '800px';
        tempContainer.style.padding = '40px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.fontFamily = "'Microsoft YaHei', '微软雅黑', sans-serif";
        
        // 添加标题
        const title = document.createElement('h1');
        title.textContent = '心动情书';
        title.style.color = 'var(--book-color)';
        title.style.textAlign = 'center';
        title.style.fontSize = '32px';
        title.style.marginBottom = '30px';
        tempContainer.appendChild(title);
        
        // 添加收信人
        const recipient = document.createElement('h2');
        // 获取正确的收信人
        let recipientName = '';
        // 尝试从页面内容获取
        const firstPageTitle = pages[0]?.querySelector('.page-front h2');
        if (firstPageTitle) {
            recipientName = firstPageTitle.textContent;
        } else if (contentElement && contentElement.querySelector('h2')) {
            recipientName = contentElement.querySelector('h2').textContent;
        } else {
            recipientName = '特别的你';
        }
        
        
        recipient.textContent = recipientName;
        recipient.style.fontSize = '24px';
        recipient.style.marginBottom = '20px';
        recipient.style.color = 'var(--book-color)';
        tempContainer.appendChild(recipient);
        
        // 添加所有段落内容
        paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            p.style.marginBottom = '20px';
            p.style.fontSize = '18px';
            p.style.lineHeight = '1.8';
            tempContainer.appendChild(p);
        });
        
        // 添加署名
        const signature = document.createElement('p');
        signature.textContent = bookSignature.textContent;
        signature.style.textAlign = 'right';
        signature.style.marginTop = '40px';
        signature.style.fontStyle = 'italic';
        signature.style.fontSize = '24px';
        signature.style.color = 'var(--book-color)';
        tempContainer.appendChild(signature);
        
        // 添加页脚
        const footer = document.createElement('div');
        footer.style.marginTop = '50px';
        footer.style.borderTop = '1px solid #eee';
        footer.style.paddingTop = '20px';
        footer.style.textAlign = 'center';
        footer.style.color = '#888';
        footer.style.fontSize = '14px';
        footer.textContent = '制作于 ' + new Date().toLocaleDateString();
        tempContainer.appendChild(footer);
        
        // 将临时容器添加到文档中（不可见）
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
        
        // 使用html2canvas生成图片
        html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            // 显示预览
            imagePreview.src = canvas.toDataURL('image/png');
            imagePreviewContainer.style.display = 'flex';
            
            // 保存图片数据以供下载
            imagePreview.dataset.download = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            
            // 从DOM中移除临时容器
            document.body.removeChild(tempContainer);
        });
    }
    
    // 下载图片
    function downloadImage() {
        if (!imagePreview.src) return;
        
        const link = document.createElement('a');
        link.download = '心动情书_' + new Date().getTime() + '.png';
        link.href = imagePreview.dataset.download;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 分享按钮点击事件
    shareButton && shareButton.addEventListener('click', function() {
        // 获取当前URL，如果没有自定义数据参数，则添加默认URL
        let shareUrl = window.location.href;
        if (!shareUrl.includes('?data=')) {
            shareUrl = window.location.origin + window.location.pathname + '?customize=true';
        }
        
        // 检查Web Share API是否可用
        if (navigator.share) {
            navigator.share({
                title: '给你的一封特别情书',
                text: '我给你发了一封特别的情书，点击查看~',
                url: shareUrl
            })
            .then(() => console.log('分享成功'))
            .catch((error) => console.log('分享失败', error));
        } else {
            // 如果Web Share API不可用，则复制链接到剪贴板
            const tempInput = document.createElement('input');
            document.body.appendChild(tempInput);
            tempInput.value = shareUrl;
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            // 显示提示
            const originalText = shareButton.textContent;
            shareButton.textContent = '链接已复制！';
            setTimeout(() => {
                shareButton.textContent = originalText;
            }, 2000);
        }
    });

    // 检查是否需要转到自定义页面
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('customize') === 'true') {
        window.location.href = 'customize.html';
    }

    // 添加一些微小的动画效果，使信封看起来更生动
    setTimeout(() => {
        envelope.style.transition = 'transform 0.3s ease';
        let animating = false;
        
        envelope.addEventListener('mouseover', function() {
            if (!isOpen && !animating) {
                animating = true;
                envelope.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    envelope.style.transform = 'scale(1)';
                    animating = false;
                }, 300);
            }
        });
    }, 1000);

    // 播放翻页声音
    function playPageTurnSound() {
        // 创建音频上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建振荡器
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // 设置声音参数 - 模拟纸张翻动的声音
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.2);
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 播放声音
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    }
}); 