document.addEventListener('DOMContentLoaded', function() {
    const envelope = document.getElementById('envelope');
    const instructions = document.querySelector('.instructions');
    const shareButton = document.getElementById('shareButton');
    const nextParagraphBtn = document.getElementById('nextParagraphBtn');
    const paragraphCounter = document.getElementById('paragraphCounter');
    const createNewBtn = document.getElementById('createNewBtn');
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
    const mobileSaveTip = document.getElementById('mobileSaveTip');
    
    // 花朵模式相关元素
    const flowerContainer = document.getElementById('flowerContainer');
    const flowerTitleDisplay = document.getElementById('flowerTitleDisplay');
    const flowerContentPanel = document.getElementById('flowerContentPanel');
    const flowerContent = document.getElementById('flowerContent');
    const flowerContentTitle = document.getElementById('flowerContentTitle');
    const flowerContentText = document.getElementById('flowerContentText');
    const closeFlowerBtn = document.getElementById('closeFlowerBtn');
    const flowerPrevBtn = document.getElementById('flowerPrevBtn');
    const flowerNextBtn = document.getElementById('flowerNextBtn');
    const flowerPetals = document.querySelectorAll('.flower-petal-display');
    
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
    let useFlowerMode = false; // 新增花朵模式标识
    let customLetterTitle = '心动情书'; // 全局变量存储自定义情书标题
    
    // 全局颜色变量，用于图片生成
    let currentColor = '#e74c3c';
    let currentGradient = null;
    
    // 花朵模式相关变量
    let flowerParagraphs = [];
    let currentFlowerParagraph = 0;
    let isFlowerContentOpen = false;

    // 检查URL参数或LocalStorage中是否有自定义数据
    function getCustomData() {
        // 先检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data');
        const compressedData = urlParams.get('d'); // 新增支持压缩数据格式
        const isPreview = urlParams.get('preview') === 'true';
        
        // 尝试解析压缩数据格式（优先）
        if (compressedData) {
            try {
                // 确保LZString已加载
                if (typeof LZString === 'undefined') {
                    // 如果LZString未加载，动态加载它
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js';
                    document.head.appendChild(script);
                    
                    // 等待脚本加载完成
                    return new Promise((resolve) => {
                        script.onload = () => {
                            try {
                                const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
                                const parsedData = JSON.parse(decompressed);
                                
                                // 转换简短字段名为完整字段名
                                const result = {
                                    letterTitle: parsedData.t,
                                    recipient: parsedData.r,
                                    paragraphs: parsedData.p,
                                    signature: parsedData.s,
                                    color: parsedData.c,
                                    gradient: parsedData.g, // 添加渐变信息
                                    bookMode: parsedData.b,
                                    mode: parsedData.m, // 添加模式字段
                                    preview: true,  // 添加预览标记
                                    autoOpen: true  // 添加自动打开标记
                                };
                                console.log('Promise解析的数据:', result);
                                resolve(result);
                            } catch (e) {
                                console.error('解析压缩数据出错', e);
                                resolve(null);
                            }
                        };
                        script.onerror = () => resolve(null);
                    });
                } else {
                    // LZString已加载，直接解压
                    const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
                    const parsedData = JSON.parse(decompressed);
                    
                    // 转换简短字段名为完整字段名
                    return {
                        letterTitle: parsedData.t,
                        recipient: parsedData.r,
                        paragraphs: parsedData.p,
                        signature: parsedData.s,
                        color: parsedData.c,
                        gradient: parsedData.g, // 添加渐变信息
                        bookMode: parsedData.b,
                        mode: parsedData.m, // 添加模式字段
                        preview: true,  // 添加预览标记
                        autoOpen: true  // 添加自动打开标记
                    };
                }
            } catch (e) {
                console.error('解析压缩数据出错', e);
            }
        }
        
        // 尝试旧格式数据
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
        const customDataResult = getCustomData();
        console.log('获取到的自定义数据结果:', customDataResult);
        
        // 处理Promise情况
        if (customDataResult && typeof customDataResult.then === 'function') {
            console.log('检测到Promise，等待解析...');
            customDataResult.then(customData => {
                console.log('Promise解析完成，获得数据:', customData);
                processCustomData(customData);
            });
        } else {
            // 直接处理数据
            processCustomData(customDataResult);
        }
    }
    
    // 处理自定义数据的核心逻辑
    function processCustomData(customData) {
        console.log('处理自定义数据:', customData);
        
        if (customData) {
            console.log('自定义数据详情:', {
                letterTitle: customData.letterTitle,
                recipient: customData.recipient,
                paragraphs: customData.paragraphs ? customData.paragraphs.length : 0,
                signature: customData.signature,
                color: customData.color,
                gradient: customData.gradient,
                bookMode: customData.bookMode,
                mode: customData.mode,
                preview: customData.preview,
                autoOpen: customData.autoOpen
            });
            
            // 设置页面标题
            if (customData.letterTitle) {
                customLetterTitle = customData.letterTitle; // 保存到全局变量
                document.title = customData.letterTitle;
                // 同时设置书籍标题
                const bookTitleElement = document.querySelector('.book-title');
                if (bookTitleElement) {
                    bookTitleElement.textContent = customData.letterTitle;
                }
            }
            
            // 检查是否是书籍模式
            useBookMode = customData.bookMode === true;
            
            // 检查是否是花朵模式
            useFlowerMode = customData.mode === 'flower';
            
            console.log('模式检测结果:', { 
                bookMode: customData.bookMode, 
                mode: customData.mode, 
                useBookMode, 
                useFlowerMode 
            });
            
            // 如果指定了花朵模式，优先使用花朵模式
            if (useFlowerMode) {
                useBookMode = false;
                console.log('设置为花朵模式');
            }
            
            // 如果是分享模式，隐藏创建新情书按钮
            if (customData.data || window.location.search.includes('data=')) {
                if (createNewBtn) {
                    createNewBtn.style.display = 'none';
                }
            }
            
            // 设置内容
            if (customData.recipient) {
                const recipient = customData.recipient;
                // 更新收信人
                const recipientElement = document.querySelector('h2');
                if (recipientElement) {
                    recipientElement.textContent = recipient;
                }
                
                // 更新书籍副标题
                const bookSubtitleElement = document.querySelector('.book-subtitle');
                if (bookSubtitleElement) {
                    bookSubtitleElement.textContent = '献给' + recipient;
                }
            }
            
            if (customData.paragraphs && customData.paragraphs.length > 0) {
                paragraphs = customData.paragraphs;
                isStepByStep = true;
                
                // 选择正确的内容元素
                contentElement = useBookMode || useFlowerMode ? 
                    document.querySelector('.book-container .page-content p') : 
                    document.querySelector('.card-content p');
                
                signatureElement = useBookMode || useFlowerMode ? 
                    document.querySelector('.book-container .signature') : 
                    document.querySelector('.card-content .signature');
                
                // 根据模式设置页面
                if (useFlowerMode) {
                    console.log('进入花朵模式设置');
                    // 隐藏信封和书籍
                    document.getElementById('envelope').style.display = 'none';
                    if (bookContainer) bookContainer.style.display = 'none';
                    
                    // 显示花朵容器
                    if (flowerContainer) {
                        flowerContainer.style.display = 'flex';
                        console.log('显示花朵容器');
                    }
                    
                    // 设置花朵模式
                    setupFlowerMode(
                        customData.recipient || '亲爱的朋友', 
                        customData.paragraphs, 
                        customData.signature || '爱你的朋友',
                        customData.letterTitle || '爱如花开',
                        customData.color,
                        customData.gradient  // 传递渐变信息
                    );
                } else if (useBookMode) {
                    console.log('进入书籍模式设置');
                    
                    // 检查DOM元素是否存在
                    console.log('DOM元素检查:', {
                        envelope: !!document.getElementById('envelope'),
                        flowerContainer: !!flowerContainer,
                        bookContainer: !!bookContainer,
                        bookNavigation: !!bookNavigation,
                        firstPage: !!document.querySelector('.first-page')
                    });
                    
                    // 隐藏信封和花朵
                    document.getElementById('envelope').style.display = 'none';
                    if (flowerContainer) flowerContainer.style.display = 'none';
                    
                    // 显示书籍
                    if (bookContainer) {
                        bookContainer.style.display = 'flex';
                        console.log('显示书籍容器');
                    }
                    
                    // 显示书籍导航
                    if (bookNavigation) {
                        bookNavigation.style.display = 'flex';
                        console.log('显示书籍导航');
                    }
                    
                    // 设置书籍模式
                    setupBookPages(
                        customData.recipient || '亲爱的朋友', 
                        customData.paragraphs, 
                        customData.signature || '爱你的朋友',
                        customData.letterTitle || '我的情书',
                        customData.color,
                        customData.gradient  // 传递渐变信息
                    );
                    
                    // 显示首页
                    const firstPage = document.querySelector('.first-page');
                    if (firstPage) {
                        firstPage.style.display = 'flex';
                        console.log('显示首页');
                        
                        // 给首页添加点击事件（如果还没有添加的话）
                        firstPage.addEventListener('click', function() {
                            console.log('首页被点击，开始翻页');
                            this.style.display = 'none';
                            if (pages.length > 0) {
                                pages[0].style.display = 'block';
                                currentPage = 0;
                                updateBookNavigation();
                            }
                        }, { once: true });
                    } else {
                        console.error('首页元素未找到!');
                    }
                } else {
                    // 信封模式
                    if (flowerContainer) flowerContainer.style.display = 'none';
                    if (bookContainer) bookContainer.style.display = 'none';
                    
                    // 显示第一段
                    displayParagraph(0);
                    updateParagraphCounter();
                }
            }
            
            if (customData.signature) {
                // 更新签名
                if (signatureElement) {
                    signatureElement.textContent = customData.signature;
                }
                
                // 更新书籍签名
                if (bookSignature) {
                    bookSignature.textContent = customData.signature;
                }
            }
            
            // 应用颜色（支持渐变色）
            if (customData.color) {
                // 保存颜色信息到全局变量
                currentColor = customData.color;
                currentGradient = customData.gradient;
                applyColor(customData.color, customData.gradient);
            }
            
            // 如果有预览标记且是自动开启，直接打开
            if (customData.preview && customData.autoOpen) {
                console.log('预览模式自动打开，当前模式:', { useFlowerMode, useBookMode });
                if (useFlowerMode) {
                    // 花朵模式直接可见，不需要特殊打开操作
                    console.log('花朵模式已自动显示');
                } else if (useBookMode) {
                    // 书籍模式直接可见，不需要特殊打开操作
                    console.log('书籍模式已自动显示');
                } else {
                    // 信封模式需要自动打开
                    console.log('信封模式自动打开');
                    setTimeout(() => {
                        openEnvelope();
                    }, 500);
                }
            }
        } else {
            console.log('没有自定义数据，使用默认模式');
        }
    }
    
    // 设置书籍页面
    function setupBookPages(recipient, paragraphs, signature, letterTitle, color, gradient) {
        // 创建页面内容 - 每页只在正面显示一个段落
        const totalPages = paragraphs.length;
        console.log(`总段落数: ${paragraphs.length}, 总页数: ${totalPages}`);
        
        // 设置首页内容
        const firstPage = document.querySelector('.first-page');
        if (firstPage) {
            // 更新首页标题
            const bookTitle = firstPage.querySelector('.book-title');
            if (bookTitle) bookTitle.textContent = letterTitle || '心动情书';
            
            // 更新首页副标题
            const bookSubtitle = firstPage.querySelector('.book-subtitle');
            if (bookSubtitle) bookSubtitle.textContent = `献给${recipient}`;
        }
        
        // 设置末页内容
        const lastPageElement = document.getElementById('lastPage');
        if (lastPageElement) {
            lastPageElement.style.display = 'none';
            // 更新签名
            const lastPageSignature = lastPageElement.querySelector('.signature');
            if (lastPageSignature) lastPageSignature.textContent = signature;
        }
        
        // 初始设置currentPage为-1，表示在首页
        currentPage = -1;
        
        for (let i = 0; i < totalPages; i++) {
            // 计算当前段落内容字数（不包括标点符号和空格）
            const textLength = paragraphs[i].replace(/[\s\p{P}]/gu, '').length;
            
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
            
            // 根据内容长度调整标题样式
            if (textLength <= 30) {
                // 内容很少时，标题也适当调整
                frontTitle.style.fontSize = '28px';
                frontTitle.style.marginBottom = '40px';
                frontTitle.style.textAlign = 'center';
                frontTitle.style.fontWeight = '500';
            } else if (textLength <= 80) {
                // 内容适中时的标题样式
                frontTitle.style.fontSize = '26px';
                frontTitle.style.marginBottom = '35px';
                frontTitle.style.textAlign = 'center';
                frontTitle.style.fontWeight = '500';
            } else {
                // 内容较多时使用默认样式
                frontTitle.style.marginBottom = '25px';
            }
            
            pageFront.appendChild(frontTitle);
            
            // 添加内容
            const paragraph = document.createElement('p');
            paragraph.textContent = paragraphs[i];
            
            // 根据内容长度动态调整样式
            if (textLength <= 30) {
                // 内容很少：大字体，居中显示，添加装饰元素
                paragraph.style.fontSize = '24px';
                paragraph.style.textAlign = 'center';
                paragraph.style.lineHeight = '2.2';
                paragraph.style.fontWeight = '400';
                paragraph.style.marginTop = '60px';
                paragraph.style.marginBottom = '60px';
                paragraph.style.position = 'relative';
                
                // 添加装饰性引号
                paragraph.style.quotes = '"" ""';
                paragraph.style.setProperty('--before-content', '"""');
                paragraph.style.setProperty('--after-content', '"""');
                
                // 添加一些装饰性的间距
                pageFront.style.justifyContent = 'center';
                pageFront.style.alignItems = 'center';
                pageFront.style.display = 'flex';
                pageFront.style.flexDirection = 'column';
                
                // 为短内容添加优雅的装饰边框
                pageFront.style.background = 'linear-gradient(145deg, #fafafa, #ffffff)';
                pageFront.style.position = 'relative';
            } else if (textLength <= 80) {
                // 内容适中：稍大字体，居中对齐
                paragraph.style.fontSize = '20px';
                paragraph.style.textAlign = 'center';
                paragraph.style.lineHeight = '2.0';
                paragraph.style.marginTop = '40px';
                paragraph.style.marginBottom = '40px';
                pageFront.style.justifyContent = 'center';
                pageFront.style.alignItems = 'center';
                pageFront.style.display = 'flex';
                pageFront.style.flexDirection = 'column';
            } else if (textLength <= 150) {
                // 内容较多：正常字体，左对齐
                paragraph.style.fontSize = '18px';
                paragraph.style.textAlign = 'justify';
                paragraph.style.lineHeight = '1.8';
                paragraph.style.marginTop = '20px';
                paragraph.style.marginBottom = '20px';
            } else {
                // 内容很多：较小字体，确保能完整显示
                paragraph.style.fontSize = '16px';
                paragraph.style.textAlign = 'justify';
                paragraph.style.lineHeight = '1.7';
                paragraph.style.marginTop = '15px';
                paragraph.style.marginBottom = '15px';
            }
            
            pageFront.appendChild(paragraph);
            console.log(`页面 ${i+1} 内容: ${paragraphs[i].substring(0, 20)}..., 字数: ${textLength}`);
            
            // 如果是最后一页，添加签名
            if (i === paragraphs.length - 1) {
                const signatureEl = document.createElement('p');
                signatureEl.className = 'signature';
                signatureEl.textContent = signature;
                
                // 根据内容长度调整签名样式
                if (textLength <= 30) {
                    // 内容很少时，签名居中显示
                    signatureEl.style.textAlign = 'center';
                    signatureEl.style.fontSize = '20px';
                    signatureEl.style.marginTop = '60px';
                } else if (textLength <= 80) {
                    // 内容适中时，签名居中
                    signatureEl.style.textAlign = 'center';
                    signatureEl.style.fontSize = '20px';
                    signatureEl.style.marginTop = '40px';
                } else {
                    // 内容较多时，签名右对齐（保持默认样式）
                    signatureEl.style.textAlign = 'right';
                    signatureEl.style.marginTop = '30px';
                }
                
                pageFront.appendChild(signatureEl);
            }
            
            pageContent.appendChild(pageFront);
            page.appendChild(pageContent);
            
            // 初始状态下隐藏此页面
            page.style.display = 'none';
            
            // 将页面添加到书籍容器中
            book.appendChild(page);
            pages.push(page);
            
            // 添加翻页点击事件
            page.addEventListener('click', function(e) {
                // 防止点击页面内容元素时触发翻页
                if (e.target.closest('.page-content')) {
                    return;
                }
                
                if (i < totalPages - 1) {
                    // 如果不是最后一页，点击进入下一页
                    this.style.display = 'none';
                    pages[i + 1].style.display = 'block';
                    currentPage = i + 1;
                    updateBookNavigation();
                } else {
                    // 如果是最后一页，点击显示结尾页
                    this.style.display = 'none';
                    lastPage.style.display = 'flex';
                    currentPage = pages.length;
                    updateBookNavigation();
                }
                
                playPageTurnSound();
            });
        }
        
        // 更新导航按钮状态
        updateBookNavigation();
        
        // 确保所有内容页面都是隐藏的
        pages.forEach(page => {
            page.style.display = 'none';
        });
        
        console.log('书籍页面设置完成，总页数:', totalPages, '当前页面:', currentPage);
    }
    
    // 上一页函数
    function prevPage() {
        if (currentPage > -1) {
            if (currentPage === pages.length) {
                // 如果当前是最后一页，返回到最后一个内容页
                lastPage.style.display = 'none';
                pages[pages.length - 1].style.display = 'block';
            } else if (currentPage === 0) {
                // 如果当前是第一页内容，返回到首页
                pages[0].style.display = 'none';
                document.querySelector('.first-page').style.display = 'flex';
                currentPage = -1;
                updateBookNavigation();
                playPageTurnSound();
                return;
            } else if (currentPage === -1) {
                // 如果当前是首页，返回到信封
                document.querySelector('.first-page').style.display = 'none';
                envelope.style.display = 'block';
                instructions.style.display = 'block';
                bookContainer.style.display = 'none';
                bookNavigation.style.display = 'none';
                isOpen = true;
                return;
            } else {
                // 隐藏当前页，显示上一页
                pages[currentPage].style.display = 'none';
                pages[currentPage - 1].style.display = 'block';
            }
            
            currentPage--;
            updateBookNavigation();
            playPageTurnSound();
        } else if (currentPage === -1) {
            // 如果当前是首页，返回到信封
            document.querySelector('.first-page').style.display = 'none';
            envelope.style.display = 'block';
            instructions.style.display = 'block';
            bookContainer.style.display = 'none';
            bookNavigation.style.display = 'none';
            isOpen = true;
        }
    }
    
    // 下一页函数
    function nextPage() {
        if (currentPage < pages.length) {
            // 隐藏当前页
            if (currentPage === -1) {
                // 如果是首页，隐藏首页显示第一页内容
                document.querySelector('.first-page').style.display = 'none';
                pages[0].style.display = 'block';
            } else if (currentPage === pages.length - 1) {
                // 如果是最后一个内容页，显示结尾页
                pages[currentPage].style.display = 'none';
                lastPage.style.display = 'flex';
            } else {
                // 常规翻页
                pages[currentPage].style.display = 'none';
                pages[currentPage + 1].style.display = 'block';
            }
            
            currentPage++;
            updateBookNavigation();
            playPageTurnSound();
        }
    }
    
    // 更新书籍导航按钮状态
    function updateBookNavigation() {
        if (prevBtn && nextBtn) {
            // 如果当前是首页（-1）或之前，禁用上一页按钮
            prevBtn.disabled = currentPage <= -1;
            // 如果当前是最后一页或之后，禁用下一页按钮
            nextBtn.disabled = currentPage >= pages.length;
            
            // 特殊情况：如果用户在首页，修改上一页按钮文本
            if (currentPage === -1) {
                prevBtn.textContent = '返回信封';
            } else {
                prevBtn.textContent = '← 上一页';
            }
            
            // 特殊情况：如果用户在最后一个内容页，修改下一页按钮文本
            if (currentPage === pages.length - 1) {
                nextBtn.textContent = '进入末页 →';
            } else {
                nextBtn.textContent = '下一页 →';
            }
        }
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
        console.log('openEnvelope被调用，当前模式:', { useFlowerMode, useBookMode });
        
        if (useFlowerMode) {
            console.log('执行花朵模式逻辑');
            // 花朵模式：隐藏信封，显示花朵容器
            envelope.style.display = 'none';
            instructions.style.display = 'none';
            
            // 调试：检查信封和指令的隐藏状态
            console.log('信封和指令隐藏状态:', {
                envelopeDisplay: envelope.style.display,
                instructionsDisplay: instructions.style.display
            });
            
            // 检查container元素
            const container = document.querySelector('.container');
            if (container) {
                console.log('主容器状态:', {
                    display: window.getComputedStyle(container).display,
                    width: container.offsetWidth,
                    height: container.offsetHeight
                });
            }
            
            if (flowerContainer) {
                console.log('显示花朵容器');
                flowerContainer.style.display = 'block';
                
                // 调试：检查花朵容器的实际状态
                console.log('花朵容器当前样式:', {
                    display: flowerContainer.style.display,
                    width: flowerContainer.offsetWidth,
                    height: flowerContainer.offsetHeight,
                    visibility: window.getComputedStyle(flowerContainer).visibility,
                    opacity: window.getComputedStyle(flowerContainer).opacity,
                    position: window.getComputedStyle(flowerContainer).position
                });
                
                // 检查花朵容器内的子元素
                const children = flowerContainer.children;
                console.log('花朵容器子元素数量:', children.length);
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    console.log(`子元素 ${i}:`, {
                        tagName: child.tagName,
                        className: child.className,
                        id: child.id,
                        display: window.getComputedStyle(child).display,
                        visibility: window.getComputedStyle(child).visibility
                    });
                }
                
                // 强制重新计算样式
                flowerContainer.offsetHeight;
            } else {
                console.error('花朵容器未找到!');
            }
            
            isOpen = true;
            return;
        }
        
        // 原有的书籍/信封逻辑
        envelope.classList.add('open');
        instructions.textContent = '点击信封关闭';
        isOpen = true;
        
        // 如果是书籍模式，显示书籍并隐藏信封
        if (useBookMode && paragraphs.length > 0) {
            setTimeout(() => {
                envelope.style.display = 'none';
                instructions.style.display = 'none';
                bookContainer.style.display = 'flex';
                bookNavigation.style.display = 'flex';
                
                // 显示首页
                const firstPage = document.querySelector('.first-page');
                if (firstPage) {
                    firstPage.style.display = 'flex';
                    
                    // 隐藏所有内容页面
                    pages.forEach(page => {
                        page.style.display = 'none';
                    });
                    
                    // 重置当前页面状态
                    currentPage = -1;
                    updateBookNavigation();
                    
                    // 给首页添加点击事件
                    firstPage.addEventListener('click', function() {
                        console.log('首页被点击，开始翻页');
                        this.style.display = 'none';
                        if (pages.length > 0) {
                            pages[0].style.display = 'block';
                            currentPage = 0;
                            updateBookNavigation();
                        }
                    }, { once: true });
                }
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
    
    // 查看图片按钮点击事件 - 新增功能
    const viewImageBtn = document.getElementById('viewImageBtn');
    viewImageBtn && viewImageBtn.addEventListener('click', function() {
        generateCompleteImageForView();
    });
    
    // 图片预览关闭按钮点击事件
    imagePreviewClose && imagePreviewClose.addEventListener('click', function() {
        imagePreviewContainer.style.display = 'none';
        // 恢复下载按钮和移动端保存提示的显示状态
        if (downloadImageBtn) {
            downloadImageBtn.style.display = 'block';
        }
        if (mobileSaveTip) {
            mobileSaveTip.style.display = 'block';
        }
    });
    
    // 下载图片按钮点击事件
    downloadImageBtn && downloadImageBtn.addEventListener('click', function() {
        downloadImage();
    });
    
    // 生成完整情书图片
    function generateCompleteImage() {
        // 创建一个临时容器来放置完整内容
        const tempContainer = document.createElement('div');
        tempContainer.style.width = '1000px';
        tempContainer.style.padding = '50px';
        tempContainer.style.position = 'relative';
        tempContainer.style.fontFamily = "'Microsoft YaHei', '微软雅黑', sans-serif";
        tempContainer.style.color = '#333';
        tempContainer.style.lineHeight = '1.6';
        
        // 获取当前应用的颜色 - 优先使用全局变量
        let color = currentColor;
        let gradient = currentGradient;
        
        console.log('保存图片时获取的颜色信息:', { currentColor, currentGradient, color, gradient });
        
        // 如果全局变量没有值，尝试从页面元素中获取
        if (!color || color === '#e74c3c') {
            // 尝试从CSS变量中获取书籍颜色
            const bookColor = getComputedStyle(document.documentElement).getPropertyValue('--book-color').trim();
            if (bookColor) {
                color = bookColor;
            } else {
                // 尝试从信封前面获取颜色
                const envelopeFront = document.querySelector('.front');
                if (envelopeFront) {
                    const frontStyle = window.getComputedStyle(envelopeFront);
                    const backgroundColor = frontStyle.backgroundColor;
                    const backgroundImage = frontStyle.backgroundImage;
                    
                    if (backgroundImage && backgroundImage !== 'none') {
                        // 如果是渐变背景
                        gradient = backgroundImage;
                        color = 'gradient';
                    } else if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
                        // 如果是单色背景，转换rgb到hex
                        color = rgbToHex(backgroundColor) || color;
                    }
                }
            }
        }
        
        // 创建简化的背景
        if (color === 'gradient' && gradient) {
            tempContainer.style.background = gradient;
        } else {
            const baseColor = color;
            const lightColor = adjustColor(baseColor, 40);
            tempContainer.style.background = `linear-gradient(135deg, ${lightColor} 0%, ${baseColor} 100%)`;
        }
        
        // 添加内容容器
        const contentWrapper = document.createElement('div');
        contentWrapper.style.background = 'rgba(255, 255, 255, 0.95)';
        contentWrapper.style.margin = '20px';
        contentWrapper.style.padding = '40px';
        contentWrapper.style.borderRadius = '15px';
        contentWrapper.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        contentWrapper.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        tempContainer.appendChild(contentWrapper);
        
        // 添加装饰心形图案
        const heartDecor1 = document.createElement('div');
        heartDecor1.innerHTML = '💖';
        heartDecor1.style.position = 'absolute';
        heartDecor1.style.top = '15px';
        heartDecor1.style.left = '15px';
        heartDecor1.style.fontSize = '24px';
        heartDecor1.style.opacity = '0.7';
        contentWrapper.appendChild(heartDecor1);
        
        const heartDecor2 = document.createElement('div');
        heartDecor2.innerHTML = '💕';
        heartDecor2.style.position = 'absolute';
        heartDecor2.style.top = '15px';
        heartDecor2.style.right = '15px';
        heartDecor2.style.fontSize = '20px';
        heartDecor2.style.opacity = '0.7';
        contentWrapper.appendChild(heartDecor2);
        
        // 添加标题 - 使用自定义情书名称
        const title = document.createElement('h1');
        title.textContent = customLetterTitle;
        title.style.textAlign = 'center';
        title.style.fontSize = '36px';
        title.style.marginBottom = '30px';
        title.style.fontWeight = 'bold';
        title.style.letterSpacing = '2px';
        
        // 为标题设置动态颜色效果
        if (color === 'gradient' && gradient) {
            // 渐变色：提取主色调
            const baseColor = extractFirstColorFromGradient(gradient);
            title.style.color = baseColor;
            title.style.textShadow = `3px 3px 8px ${adjustColor(baseColor, -40)}60, 0 0 20px ${adjustColor(baseColor, 20)}40`;
        } else {
            // 单色：使用主色调
            title.style.color = color;
            title.style.textShadow = `3px 3px 8px ${adjustColor(color, -60)}60, 0 0 15px ${adjustColor(color, 20)}30`;
        }
        
        contentWrapper.appendChild(title);
        
        // 添加装饰线
        const decorLine = document.createElement('div');
        decorLine.style.width = '200px';
        decorLine.style.height = '4px';
        if (color === 'gradient' && gradient) {
            decorLine.style.background = gradient;
        } else {
            decorLine.style.background = `linear-gradient(90deg, ${adjustColor(color, 20)}, ${color}, ${adjustColor(color, 20)})`;
        }
        decorLine.style.margin = '0 auto 30px auto';
        decorLine.style.borderRadius = '2px';
        decorLine.style.opacity = '0.8';
        contentWrapper.appendChild(decorLine);
        
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
        recipient.style.fontSize = '28px';
        recipient.style.marginBottom = '25px';
        recipient.style.fontWeight = '600';
        recipient.style.textAlign = 'left';
        
        // 为收信人设置颜色效果
        if (color === 'gradient' && gradient) {
            const baseColor = extractFirstColorFromGradient(gradient);
            const recipientColor = adjustColor(baseColor, -10); // 比标题稍微深一点
            recipient.style.color = recipientColor;
            recipient.style.textShadow = `2px 2px 6px ${adjustColor(recipientColor, -30)}40`;
        } else {
            const recipientColor = adjustColor(color, -10);
            recipient.style.color = recipientColor;
            recipient.style.textShadow = `2px 2px 6px ${adjustColor(recipientColor, -40)}40`;
        }
        
        contentWrapper.appendChild(recipient);
        
        // 添加所有段落内容
        paragraphs.forEach((paragraph, index) => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            p.style.marginBottom = '25px';
            p.style.fontSize = index === 0 ? '22px' : '20px';
            p.style.lineHeight = '1.8';
            p.style.textAlign = 'justify';
            p.style.textIndent = '2em';
            p.style.color = '#444';
            p.style.fontWeight = index === 0 ? '500' : 'normal';
            contentWrapper.appendChild(p);
        });
        
        // 添加署名
        const signature = document.createElement('p');
        signature.textContent = bookSignature.textContent + ' ✨';
        signature.style.textAlign = 'right';
        signature.style.marginTop = '40px';
        signature.style.fontStyle = 'italic';
        signature.style.fontSize = '26px';
        signature.style.fontWeight = 'bold';
        
        // 为署名设置颜色效果
        if (color === 'gradient' && gradient) {
            const baseColor = extractFirstColorFromGradient(gradient);
            const signatureColor = adjustColor(baseColor, 10); // 比标题稍微亮一点
            signature.style.color = signatureColor;
            signature.style.textShadow = `2px 2px 6px ${adjustColor(signatureColor, -50)}50, 0 0 12px ${adjustColor(signatureColor, 30)}30`;
        } else {
            const signatureColor = adjustColor(color, 10);
            signature.style.color = signatureColor;
            signature.style.textShadow = `2px 2px 6px ${adjustColor(signatureColor, -50)}50, 0 0 12px ${adjustColor(signatureColor, 30)}30`;
        }
        
        contentWrapper.appendChild(signature);
        
        // 添加页脚
        const footer = document.createElement('div');
        footer.style.marginTop = '50px';
        footer.style.paddingTop = '20px';
        footer.style.textAlign = 'center';
        footer.style.fontSize = '16px';
        footer.style.fontStyle = 'italic';
        
        // 为页脚设置颜色效果
        if (color === 'gradient' && gradient) {
            const baseColor = extractFirstColorFromGradient(gradient);
            const footerColor = adjustColor(baseColor, -30);
            footer.style.color = footerColor;
            footer.style.borderTop = `1px solid ${adjustColor(baseColor, 50)}`;
        } else {
            const footerColor = adjustColor(color, -30);
            footer.style.color = footerColor;
            footer.style.borderTop = `1px solid ${adjustColor(color, 50)}`;
        }
        
        footer.innerHTML = '🌟 用心制作于 ' + new Date().toLocaleDateString() + ' 🌟';
        contentWrapper.appendChild(footer);
        
        // 将临时容器添加到文档中（不可见）
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        document.body.appendChild(tempContainer);
        
        // 使用html2canvas生成图片
        html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            allowTaint: false,
            foreignObjectRendering: false,
            logging: true,
            width: tempContainer.offsetWidth,
            height: tempContainer.offsetHeight
        }).then(canvas => {
            // 显示预览
            imagePreview.src = canvas.toDataURL('image/png');
            imagePreviewContainer.style.display = 'flex';
            
            // 检测是否为移动设备，如果是则显示保存提示
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile && mobileSaveTip) {
                mobileSaveTip.style.display = 'block';
                // 根据具体环境调整提示文本
                if (/MicroMessenger/i.test(navigator.userAgent)) {
                    mobileSaveTip.innerHTML = '📱 微信用户：长按上方图片选择"保存图片"';
                } else if (/QQ/i.test(navigator.userAgent)) {
                    mobileSaveTip.innerHTML = '📱 QQ用户：长按上方图片选择"保存到相册"';
                } else {
                    mobileSaveTip.innerHTML = '📱 手机用户：长按上方图片即可保存到相册';
                }
                
                // 修改下载按钮文本
                if (downloadImageBtn) {
                    downloadImageBtn.textContent = '保存说明';
                }
            } else if (mobileSaveTip) {
                mobileSaveTip.style.display = 'none';
                // 桌面端保持原有按钮文本
                if (downloadImageBtn) {
                    downloadImageBtn.textContent = '下载图片';
                }
            }
            
            // 保存图片数据以供下载，同时保存文件名
            imagePreview.dataset.download = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            imagePreview.dataset.filename = customLetterTitle;
            
            // 从DOM中移除临时容器
            document.body.removeChild(tempContainer);
        }).catch(error => {
            console.error('生成图片失败:', error);
            alert('生成图片失败，请稍后重试');
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        });
    }
    
    // 生成完整情书图片（仅用于查看）
    function generateCompleteImageForView() {
        // 创建一个临时容器来放置完整内容
        const tempContainer = document.createElement('div');
        tempContainer.style.width = '1000px';
        tempContainer.style.padding = '50px';
        tempContainer.style.position = 'relative';
        tempContainer.style.fontFamily = "'Microsoft YaHei', '微软雅黑', sans-serif";
        tempContainer.style.color = '#333';
        tempContainer.style.lineHeight = '1.6';
        
        // 获取当前应用的颜色 - 优先使用全局变量
        let color = currentColor;
        let gradient = currentGradient;
        
        console.log('查看图片时获取的颜色信息:', { currentColor, currentGradient, color, gradient });
        
        // 如果全局变量没有值，尝试从页面元素中获取
        if (!color || color === '#e74c3c') {
            // 尝试从CSS变量中获取书籍颜色
            const bookColor = getComputedStyle(document.documentElement).getPropertyValue('--book-color').trim();
            if (bookColor) {
                color = bookColor;
            } else {
                // 尝试从信封前面获取颜色
                const envelopeFront = document.querySelector('.front');
                if (envelopeFront) {
                    const frontStyle = window.getComputedStyle(envelopeFront);
                    const backgroundColor = frontStyle.backgroundColor;
                    const backgroundImage = frontStyle.backgroundImage;
                    
                    if (backgroundImage && backgroundImage !== 'none') {
                        // 如果是渐变背景
                        gradient = backgroundImage;
                        color = 'gradient';
                    } else if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
                        // 如果是单色背景，转换rgb到hex
                        color = rgbToHex(backgroundColor) || color;
                    }
                }
            }
        }
        
        // 创建简化的背景
        if (color === 'gradient' && gradient) {
            tempContainer.style.background = gradient;
        } else {
            const baseColor = color;
            const lightColor = adjustColor(baseColor, 40);
            tempContainer.style.background = `linear-gradient(135deg, ${lightColor} 0%, ${baseColor} 100%)`;
        }
        
        // 添加内容容器
        const contentWrapper = document.createElement('div');
        contentWrapper.style.background = 'rgba(255, 255, 255, 0.95)';
        contentWrapper.style.margin = '20px';
        contentWrapper.style.padding = '40px';
        contentWrapper.style.borderRadius = '15px';
        contentWrapper.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        contentWrapper.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        tempContainer.appendChild(contentWrapper);
        
        // 添加装饰心形图案
        const heartDecor1 = document.createElement('div');
        heartDecor1.innerHTML = '💖';
        heartDecor1.style.position = 'absolute';
        heartDecor1.style.top = '15px';
        heartDecor1.style.left = '15px';
        heartDecor1.style.fontSize = '24px';
        heartDecor1.style.opacity = '0.7';
        contentWrapper.appendChild(heartDecor1);
        
        const heartDecor2 = document.createElement('div');
        heartDecor2.innerHTML = '💕';
        heartDecor2.style.position = 'absolute';
        heartDecor2.style.top = '15px';
        heartDecor2.style.right = '15px';
        heartDecor2.style.fontSize = '20px';
        heartDecor2.style.opacity = '0.7';
        contentWrapper.appendChild(heartDecor2);
        
        // 添加标题 - 使用自定义情书名称
        const title = document.createElement('h1');
        title.textContent = customLetterTitle;
        title.style.textAlign = 'center';
        title.style.fontSize = '36px';
        title.style.marginBottom = '30px';
        title.style.fontWeight = 'bold';
        title.style.letterSpacing = '2px';
        
        // 为标题设置动态颜色效果
        if (color === 'gradient' && gradient) {
            // 渐变色：提取主色调
            const baseColor = extractFirstColorFromGradient(gradient);
            title.style.color = baseColor;
            title.style.textShadow = `3px 3px 8px ${adjustColor(baseColor, -40)}60, 0 0 20px ${adjustColor(baseColor, 20)}40`;
        } else {
            // 单色：使用主色调
            title.style.color = color;
            title.style.textShadow = `3px 3px 8px ${adjustColor(color, -60)}60, 0 0 15px ${adjustColor(color, 20)}30`;
        }
        
        contentWrapper.appendChild(title);
        
        // 添加装饰线
        const decorLine = document.createElement('div');
        decorLine.style.width = '200px';
        decorLine.style.height = '4px';
        if (color === 'gradient' && gradient) {
            decorLine.style.background = gradient;
        } else {
            decorLine.style.background = `linear-gradient(90deg, ${adjustColor(color, 20)}, ${color}, ${adjustColor(color, 20)})`;
        }
        decorLine.style.margin = '0 auto 30px auto';
        decorLine.style.borderRadius = '2px';
        decorLine.style.opacity = '0.8';
        contentWrapper.appendChild(decorLine);
        
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
        recipient.style.fontSize = '28px';
        recipient.style.marginBottom = '25px';
        recipient.style.fontWeight = '600';
        recipient.style.textAlign = 'left';
        
        // 为收信人设置颜色效果
        if (color === 'gradient' && gradient) {
            const baseColor = extractFirstColorFromGradient(gradient);
            const recipientColor = adjustColor(baseColor, -10); // 比标题稍微深一点
            recipient.style.color = recipientColor;
            recipient.style.textShadow = `2px 2px 6px ${adjustColor(recipientColor, -30)}40`;
        } else {
            const recipientColor = adjustColor(color, -10);
            recipient.style.color = recipientColor;
            recipient.style.textShadow = `2px 2px 6px ${adjustColor(recipientColor, -40)}40`;
        }
        
        contentWrapper.appendChild(recipient);
        
        // 添加所有段落内容
        paragraphs.forEach((paragraph, index) => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            p.style.marginBottom = '25px';
            p.style.fontSize = index === 0 ? '22px' : '20px';
            p.style.lineHeight = '1.8';
            p.style.textAlign = 'justify';
            p.style.textIndent = '2em';
            p.style.color = '#444';
            p.style.fontWeight = index === 0 ? '500' : 'normal';
            contentWrapper.appendChild(p);
        });
        
        // 添加署名
        const signature = document.createElement('p');
        signature.textContent = bookSignature.textContent + ' ✨';
        signature.style.textAlign = 'right';
        signature.style.marginTop = '40px';
        signature.style.fontStyle = 'italic';
        signature.style.fontSize = '26px';
        signature.style.fontWeight = 'bold';
        
        // 为署名设置颜色效果
        if (color === 'gradient' && gradient) {
            const baseColor = extractFirstColorFromGradient(gradient);
            const signatureColor = adjustColor(baseColor, 10); // 比标题稍微亮一点
            signature.style.color = signatureColor;
            signature.style.textShadow = `2px 2px 6px ${adjustColor(signatureColor, -50)}50, 0 0 12px ${adjustColor(signatureColor, 30)}30`;
        } else {
            const signatureColor = adjustColor(color, 10);
            signature.style.color = signatureColor;
            signature.style.textShadow = `2px 2px 6px ${adjustColor(signatureColor, -50)}50, 0 0 12px ${adjustColor(signatureColor, 30)}30`;
        }
        
        contentWrapper.appendChild(signature);
        
        // 添加页脚
        const footer = document.createElement('div');
        footer.style.marginTop = '50px';
        footer.style.paddingTop = '20px';
        footer.style.textAlign = 'center';
        footer.style.fontSize = '16px';
        footer.style.fontStyle = 'italic';
        
        // 为页脚设置颜色效果
        if (color === 'gradient' && gradient) {
            const baseColor = extractFirstColorFromGradient(gradient);
            const footerColor = adjustColor(baseColor, -30);
            footer.style.color = footerColor;
            footer.style.borderTop = `1px solid ${adjustColor(baseColor, 50)}`;
        } else {
            const footerColor = adjustColor(color, -30);
            footer.style.color = footerColor;
            footer.style.borderTop = `1px solid ${adjustColor(color, 50)}`;
        }
        
        footer.innerHTML = '🌟 用心制作于 ' + new Date().toLocaleDateString() + ' 🌟';
        contentWrapper.appendChild(footer);
        
        // 将临时容器添加到文档中（不可见）
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        document.body.appendChild(tempContainer);
        
        // 使用html2canvas生成图片
        html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            allowTaint: false,
            foreignObjectRendering: false,
            logging: true,
            width: tempContainer.offsetWidth,
            height: tempContainer.offsetHeight
        }).then(canvas => {
            // 显示预览
            imagePreview.src = canvas.toDataURL('image/png');
            imagePreviewContainer.style.display = 'flex';
            
            // 隐藏下载按钮和移动端保存提示（仅查看模式）
            if (downloadImageBtn) {
                downloadImageBtn.style.display = 'none';
            }
            if (mobileSaveTip) {
                mobileSaveTip.style.display = 'none';
            }
            
            // 从DOM中移除临时容器
            document.body.removeChild(tempContainer);
        }).catch(error => {
            console.error('生成图片失败:', error);
            alert('生成图片失败，请稍后重试');
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        });
    }
    
    // 下载图片
    function downloadImage() {
        if (!imagePreview.src) return;
        
        // 检测是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 检测是否在微信内置浏览器中
        const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
        
        // 检测是否在QQ内置浏览器中
        const isQQ = /QQ/i.test(navigator.userAgent);
        
        // 检测是否在其他app内置浏览器中
        const isInApp = isWeChat || isQQ || (isMobile && !window.chrome);
        
        if (isInApp || isMobile) {
            // 对于手机端或app内置浏览器，显示特殊提示
            showMobileDownloadInstructions();
        } else {
            // 对于桌面浏览器，使用传统下载方式
            const link = document.createElement('a');
            // 使用自定义的情书名称或默认名称
            const customFileName = imagePreview.dataset.filename || '心动情书';
            link.download = customFileName + '_' + new Date().getTime() + '.png';
            link.href = imagePreview.dataset.download;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    // 显示移动端下载说明
    function showMobileDownloadInstructions() {
        // 创建说明弹窗
        const instructionModal = document.createElement('div');
        instructionModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            padding: 20px;
        `;
        
        const instructionContent = document.createElement('div');
        instructionContent.style.cssText = `
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            max-width: 350px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        // 检测具体环境并提供相应说明
        let instructions = '';
        if (/MicroMessenger/i.test(navigator.userAgent)) {
            instructions = `
                <h3 style="color: #e74c3c; margin-bottom: 15px;">📱 微信中保存图片</h3>
                <p style="line-height: 1.6; margin-bottom: 15px;">1. <strong>长按</strong>下方图片</p>
                <p style="line-height: 1.6; margin-bottom: 15px;">2. 选择"<strong>保存图片</strong>"</p>
                <p style="color: #666; font-size: 14px;">图片将保存到您的相册中</p>
            `;
        } else if (/QQ/i.test(navigator.userAgent)) {
            instructions = `
                <h3 style="color: #e74c3c; margin-bottom: 15px;">📱 QQ中保存图片</h3>
                <p style="line-height: 1.6; margin-bottom: 15px;">1. <strong>长按</strong>下方图片</p>
                <p style="line-height: 1.6; margin-bottom: 15px;">2. 选择"<strong>保存到相册</strong>"</p>
                <p style="color: #666; font-size: 14px;">图片将保存到您的相册中</p>
            `;
        } else {
            instructions = `
                <h3 style="color: #e74c3c; margin-bottom: 15px;">📱 手机中保存图片</h3>
                <p style="line-height: 1.6; margin-bottom: 15px;">1. <strong>长按</strong>下方图片</p>
                <p style="line-height: 1.6; margin-bottom: 15px;">2. 选择"<strong>保存图片</strong>"或"<strong>下载图片</strong>"</p>
                <p style="color: #666; font-size: 14px;">图片将保存到您的相册或下载文件夹中</p>
            `;
        }
        
        instructionContent.innerHTML = instructions;
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '我知道了';
        closeBtn.style.cssText = `
            background-color: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 20px;
            cursor: pointer;
            font-size: 16px;
        `;
        
        closeBtn.onclick = function() {
            document.body.removeChild(instructionModal);
        };
        
        instructionContent.appendChild(closeBtn);
        instructionModal.appendChild(instructionContent);
        document.body.appendChild(instructionModal);
        
        // 点击背景也可以关闭
        instructionModal.onclick = function(e) {
            if (e.target === instructionModal) {
                document.body.removeChild(instructionModal);
            }
        };
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

    // 创建新情书按钮点击事件
    createNewBtn && createNewBtn.addEventListener('click', function() {
        window.location.href = 'welcome.html';
    });
    
    // 计算文本字数（不包括标点符号）
    function countTextChars(text) {
        if (!text) return 0;
        // 移除所有标点符号和空格，只保留中英文字符和数字
        return text.replace(/[\s\p{P}]/gu, '').length;
    }
    
    // 计算所有段落总字数（不包括标点符号）
    function countTotalChars(paragraphs) {
        if (!paragraphs || !paragraphs.length) return 0;
        return paragraphs.reduce((total, paragraph) => {
            return total + countTextChars(paragraph);
        }, 0);
    }
    
    // ========== 花朵模式相关函数 ==========
    
    // 设置花朵模式
    function setupFlowerMode(recipient, paragraphs, signature, letterTitle, color, gradient) {
        console.log('设置花朵模式', { recipient, paragraphs, signature, letterTitle, color, gradient });
        
        // 存储花朵模式数据
        flowerParagraphs = paragraphs;
        currentFlowerParagraph = 0;
        
        // 设置花朵标题
        if (flowerTitleDisplay) {
            const titleElement = flowerTitleDisplay.querySelector('h1');
            const subtitleElement = flowerTitleDisplay.querySelector('p');
            if (titleElement) titleElement.textContent = letterTitle;
            if (subtitleElement) subtitleElement.textContent = `献给${recipient}`;
        }
        
        // 设置花朵颜色
        if (color) {
            setupFlowerColors(color, gradient);
        }
        
        // 设置花瓣点击事件
        flowerPetals.forEach((petal, index) => {
            petal.addEventListener('click', () => {
                openFlowerContent(index);
            });
        });
        
        // 设置导航按钮事件
        if (closeFlowerBtn) {
            closeFlowerBtn.addEventListener('click', closeFlowerContent);
        }
        
        if (flowerPrevBtn) {
            flowerPrevBtn.addEventListener('click', () => {
                if (currentFlowerParagraph > 0) {
                    currentFlowerParagraph--;
                    updateFlowerContent();
                }
            });
        }
        
        if (flowerNextBtn) {
            flowerNextBtn.addEventListener('click', () => {
                if (currentFlowerParagraph < flowerParagraphs.length - 1) {
                    currentFlowerParagraph++;
                    updateFlowerContent();
                }
            });
        }
        
        // 初始化内容
        updateFlowerContent();
    }
    
    // 设置花朵颜色
    function setupFlowerColors(color, gradient) {
        if (color === 'gradient' && gradient) {
            // 处理渐变色花朵
            
            // 提取渐变中的第一个颜色作为基础颜色
            const colorMatch = gradient.match(/#[a-fA-F0-9]{6}/);
            const baseColor = colorMatch ? colorMatch[0] : '#e74c3c';
            const lightColor = adjustColor(baseColor, 40);
            const darkColor = adjustColor(baseColor, -20);
            
            // 更新CSS变量
            document.documentElement.style.setProperty('--book-color', baseColor);
            document.documentElement.style.setProperty('--book-color-dark', darkColor);
            
            // 更新花朵背景使用渐变
            if (flowerContainer) {
                flowerContainer.style.background = gradient;
                flowerContainer.style.filter = 'brightness(1.3)';
            }
            
            // 更新花瓣颜色 - 每个花瓣使用渐变色的不同变化
            flowerPetals.forEach((petal, index) => {
                // 为每个花瓣创建稍微不同的渐变变化
                const rotationAngle = index * 72; // 每个花瓣间隔72度
                petal.style.background = gradient;
                petal.style.filter = `hue-rotate(${rotationAngle * 0.2}deg) brightness(${0.9 + (index * 0.05)})`;
            });
            
            // 更新花朵光晕
            const flowerGlow = document.querySelector('.flower-glow');
            if (flowerGlow) {
                flowerGlow.style.background = gradient;
                flowerGlow.style.opacity = '0.4';
            }
            
        } else {
            // 处理单色花朵
            const baseColor = color;
            const lightColor = adjustColor(color, 40);
            const darkColor = adjustColor(color, -20);
            const bgLight = adjustColor(color, 60);
            const bgMid = adjustColor(color, 30);
            
            // 更新CSS变量
            document.documentElement.style.setProperty('--book-color', baseColor);
            document.documentElement.style.setProperty('--book-color-dark', darkColor);
            
            // 更新花朵背景
            if (flowerContainer) {
                flowerContainer.style.background = `linear-gradient(135deg, ${bgLight} 0%, ${bgMid} 50%, ${bgMid} 100%)`;
                flowerContainer.style.filter = 'none';
            }
            
            // 更新花瓣颜色
            flowerPetals.forEach((petal, index) => {
                const gradientColors = [
                    `linear-gradient(45deg, ${baseColor}, ${darkColor})`,
                    `linear-gradient(45deg, ${lightColor}, ${baseColor})`,
                    `linear-gradient(45deg, ${baseColor}, ${lightColor})`,
                    `linear-gradient(45deg, ${darkColor}, ${baseColor})`,
                    `linear-gradient(45deg, ${baseColor}, ${darkColor})`
                ];
                petal.style.background = gradientColors[index % gradientColors.length];
                petal.style.filter = 'none';
            });
            
            // 更新花朵光晕
            const flowerGlow = document.querySelector('.flower-glow');
            if (flowerGlow) {
                const glowColor = adjustColor(color, 20);
                const glowColorRgb = hexToRgb(glowColor);
                if (glowColorRgb) {
                    flowerGlow.style.background = `radial-gradient(circle, rgba(${glowColorRgb.r},${glowColorRgb.g},${glowColorRgb.b},0.3) 0%, rgba(${glowColorRgb.r},${glowColorRgb.g},${glowColorRgb.b},0) 70%)`;
                    flowerGlow.style.opacity = '1';
                }
            }
        }
    }
    
    // 颜色转换辅助函数
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    // RGB转十六进制颜色
    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
        
        // 解析 rgb(r, g, b) 或 rgba(r, g, b, a) 格式
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (!match) return null;
        
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    // 从渐变中提取第一个颜色
    function extractFirstColorFromGradient(gradient) {
        if (!gradient) return '#e74c3c';
        
        // 匹配渐变中的第一个十六进制颜色
        const hexMatch = gradient.match(/#[a-fA-F0-9]{6}/);
        if (hexMatch) return hexMatch[0];
        
        // 匹配渐变中的第一个rgb颜色
        const rgbMatch = gradient.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        return '#e74c3c'; // 默认颜色
    }
    
    // 打开花朵内容面板
    function openFlowerContent(petalIndex = 0) {
        console.log('打开花朵内容面板', petalIndex);
        
        if (flowerContentPanel) {
            isFlowerContentOpen = true;
            flowerContentPanel.classList.add('active');
            flowerContentPanel.style.display = 'flex';
            
            // 根据点击的花瓣确定显示的段落
            if (petalIndex < flowerParagraphs.length) {
                currentFlowerParagraph = petalIndex;
            }
            
            updateFlowerContent();
        }
    }
    
    // 关闭花朵内容面板
    function closeFlowerContent() {
        console.log('关闭花朵内容面板');
        
        if (flowerContentPanel) {
            isFlowerContentOpen = false;
            flowerContentPanel.classList.remove('active');
            
            setTimeout(() => {
                flowerContentPanel.style.display = 'none';
            }, 500);
        }
    }
    
    // 更新花朵内容
    function updateFlowerContent() {
        if (!flowerContentTitle || !flowerContentText) return;
        
        const currentParagraph = flowerParagraphs[currentFlowerParagraph];
        
        // 设置标题
        flowerContentTitle.textContent = `第 ${currentFlowerParagraph + 1} 瓣花语`;
        
        // 设置内容
        flowerContentText.innerHTML = `<p>${currentParagraph}</p>`;
        
        // 如果是最后一段，添加签名和操作按钮
        if (currentFlowerParagraph === flowerParagraphs.length - 1) {
            const signatureEl = document.createElement('p');
            signatureEl.className = 'signature';
            signatureEl.style.textAlign = 'center';
            signatureEl.style.marginTop = '30px';
            signatureEl.style.fontSize = '18px';
            signatureEl.style.fontStyle = 'italic';
            signatureEl.textContent = document.querySelector('.signature')?.textContent || '爱你的朋友';
            flowerContentText.appendChild(signatureEl);
            
            // 添加操作按钮容器
            const actionContainer = document.createElement('div');
            actionContainer.style.display = 'flex';
            actionContainer.style.flexDirection = 'column';
            actionContainer.style.alignItems = 'center';
            actionContainer.style.gap = '12px';
            actionContainer.style.marginTop = '25px';
            
            // 添加查看图片按钮
            const viewImageBtn = document.createElement('button');
            viewImageBtn.textContent = '查看图片 🖼️';
            viewImageBtn.style.padding = '10px 20px';
            viewImageBtn.style.backgroundColor = 'var(--book-color)';
            viewImageBtn.style.color = 'white';
            viewImageBtn.style.border = 'none';
            viewImageBtn.style.borderRadius = '25px';
            viewImageBtn.style.cursor = 'pointer';
            viewImageBtn.style.fontSize = '14px';
            viewImageBtn.style.minWidth = '120px';
            viewImageBtn.style.transition = 'all 0.3s ease';
            viewImageBtn.addEventListener('click', function() {
                generateCompleteImageForView();
            });
            
            // 添加保存图片按钮
            const saveImageBtn = document.createElement('button');
            saveImageBtn.textContent = '保存为图片 💾';
            saveImageBtn.style.padding = '10px 20px';
            saveImageBtn.style.backgroundColor = 'var(--book-color)';
            saveImageBtn.style.color = 'white';
            saveImageBtn.style.border = 'none';
            saveImageBtn.style.borderRadius = '25px';
            saveImageBtn.style.cursor = 'pointer';
            saveImageBtn.style.fontSize = '14px';
            saveImageBtn.style.minWidth = '120px';
            saveImageBtn.style.transition = 'all 0.3s ease';
            saveImageBtn.addEventListener('click', function() {
                generateCompleteImage();
            });
            
            // 添加按钮悬停效果
            [viewImageBtn, saveImageBtn].forEach(btn => {
                btn.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = 'var(--book-color-dark)';
                    this.style.transform = 'translateY(-2px)';
                });
                btn.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = 'var(--book-color)';
                    this.style.transform = 'translateY(0)';
                });
            });
            
            // 将按钮添加到容器
            actionContainer.appendChild(viewImageBtn);
            actionContainer.appendChild(saveImageBtn);
            
            // 将容器添加到内容区域
            flowerContentText.appendChild(actionContainer);
        }
        
        // 更新导航按钮状态
        if (flowerPrevBtn) {
            flowerPrevBtn.disabled = currentFlowerParagraph === 0;
        }
        
        if (flowerNextBtn) {
            flowerNextBtn.disabled = currentFlowerParagraph === flowerParagraphs.length - 1;
        }
    }

    // 初始化花朵容器状态
    if (flowerContainer) {
        flowerContainer.style.display = 'none';
        console.log('花朵容器初始化为隐藏状态');
    } else {
        console.error('花朵容器DOM元素未找到!');
    }

    // 应用颜色（支持渐变色）
    function applyColor(color, gradient) {
        if (color === 'gradient' && gradient) {
            // 处理渐变色
            applyGradientColor(gradient);
        } else {
            // 处理单色
            applySolidColor(color);
        }
    }
    
    // 应用单色
    function applySolidColor(color) {
        const envelopeColor = color;
        
        // 设置信封颜色
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
        const titleElement = document.querySelector('.card-content h2');
        const signatureEl = document.querySelector('.signature');
        if (titleElement) titleElement.style.color = envelopeColor;
        if (signatureEl) signatureEl.style.color = envelopeColor;
        
        // 设置书籍元素颜色
        if (useBookMode || useFlowerMode) {
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
    
    // 应用渐变色
    function applyGradientColor(gradient) {
        // 设置信封渐变色
        document.querySelector('.front').style.background = gradient;
        
        // 提取渐变中的第一个颜色作为主色调
        const colorMatch = gradient.match(/#[a-fA-F0-9]{6}/);
        const baseColor = colorMatch ? colorMatch[0] : '#e74c3c';
        
        // 设置其他相关元素的颜色（使用渐变的暗色版本）
        const darkerGradient = gradient.replace(/brightness\([^)]*\)/g, '').replace(/\)$/, ') brightness(0.7)');
        const lighterGradient = gradient.replace(/brightness\([^)]*\)/g, '').replace(/\)$/, ') brightness(1.2)');
        
        document.querySelector('.back').style.background = darkerGradient;
        document.querySelector('.top-flap').style.background = lighterGradient;
        document.querySelector('.bottom-flap').style.background = lighterGradient;
        document.querySelector('.left-flap').style.background = lighterGradient;
        document.querySelector('.right-flap').style.background = lighterGradient;
        
        // 设置标题和签名颜色（使用基础颜色）
        const titleElement = document.querySelector('.card-content h2');
        const signatureEl = document.querySelector('.signature');
        if (titleElement) titleElement.style.color = baseColor;
        if (signatureEl) signatureEl.style.color = baseColor;
        
        // 设置书籍元素渐变色
        if (useBookMode || useFlowerMode) {
            document.documentElement.style.setProperty('--book-color', baseColor);
            document.documentElement.style.setProperty('--book-color-dark', adjustColor(baseColor, -30));
            
            // 为书籍封面应用渐变
            const firstPage = document.querySelector('.first-page');
            if (firstPage) {
                firstPage.style.background = gradient;
            }
            
            const bookElements = ['.bookmark', '.book-btn', '.book-title', '.page-content h2', '.signature'];
            bookElements.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (selector === '.book-btn') {
                        el.style.background = gradient;
                        el.style.border = 'none';
                    } else {
                        el.style.color = baseColor;
                    }
                });
            });
        }
    }
}); 