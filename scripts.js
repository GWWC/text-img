        const textInput = document.getElementById('text-input');
        const bgColorInput = document.getElementById('bg-color');
        const fontSizeInput = document.getElementById('font-size');
        const fontColorInput = document.getElementById('font-color');
        const previewImg = document.getElementById('preview-img');
        const shareButton = document.getElementById('share-button');
        const toast = document.getElementById('toast');
        const urlElement = document.getElementById('url');
        const markdownElement = document.getElementById('markdown');
        const bbcodeElement = document.getElementById('bbcode');
        const toggleDarkMode = document.getElementById('toggle-dark-mode');
        const expiryTimeInput = document.getElementById('expiry-time');
        const permanentCheckbox = document.getElementById('permanent');

        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        let darkMode = savedDarkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        toggleDarkMode.querySelector('.moon').style.display = darkMode ? 'none' : 'block';
        toggleDarkMode.querySelector('.sun').style.display = darkMode ? 'block' : 'none';

        function showToast(message) {
            toast.innerHTML = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 5000);
        }

        function generateImage() {
            const text = textInput.value;
            const bgColor = bgColorInput.value;
            const fontSize = fontSizeInput.value;
            const fontColor = fontColorInput.value;
            const padding = 5;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = bgColor;

            const lines = text.split('\n');
            const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + padding * 2;
            const lineHeight = parseInt(fontSize, 10) * 1.2;
            const height = lineHeight * lines.length + padding * 2;

            canvas.width = maxWidth;
            canvas.height = height;

            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = fontColor;
            ctx.font = `${fontSize}px Arial`;
            lines.forEach((line, index) => {
                ctx.fillText(line, padding, (index + 1) * lineHeight - (lineHeight / 4) + padding);
            });

            previewImg.src = canvas.toDataURL();
            previewImg.dataset.canvas = canvas.toDataURL();
        }

        function copyToClipboard(type) {
            const resultElement = document.getElementById(type);
            const text = resultElement.textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast(`${type}链接已复制到剪切板`);
            }, err => {
                showToast('复制到剪切板失败');
            });
        }

        function shareImage() {
            const canvasDataUrl = previewImg.dataset.canvas;
            if (!canvasDataUrl) {
                showToast('请先生成图片！');
                return;
            }

            const expiredAt = permanentCheckbox.checked ? null : expiryTimeInput.value;
            if (expiredAt && new Date(expiredAt) > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
                showToast('过期时间最大为一年后！');
                return;
            }

            fetch(canvasDataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const formData = new FormData();
                    formData.append('file', blob, 'image.png');
                    if (expiredAt) {
                        formData.append('expired_at', expiredAt);
                    }

                    fetch('https://image.dooo.ng/api/v1/upload', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.data && data.data.links && data.data.links.url) {
                            const imageUrl = data.data.links.url;
                            urlElement.textContent = imageUrl;
                            markdownElement.textContent = `![img](${imageUrl})`;
                            bbcodeElement.textContent = `[img]${imageUrl}[/img]`;

                            document.querySelectorAll('.links-section .link').forEach(link => {
                                link.style.display = 'flex';
                            });

                            document.getElementById('copy-url-button').disabled = false;
                            document.getElementById('copy-markdown-button').disabled = false;
                            document.getElementById('copy-bbcode-button').disabled = false;

                            copyToClipboard('markdown');
                            showToast('Markdown 链接已复制到剪切板');
                        } else {
                            showToast('上传成功但未获取到 URL！');
                        }
                        shareButton.disabled = false;
                    })
                    .catch(error => {
                        showToast('上传失败！');
                        console.error('错误:', error);
                        shareButton.disabled = false;
                    });
                });
        }

        textInput.addEventListener('input', generateImage);
        bgColorInput.addEventListener('input', generateImage);
        fontSizeInput.addEventListener('input', generateImage);
        fontColorInput.addEventListener('input', generateImage);

        shareButton.addEventListener('click', () => {
            shareButton.disabled = true;
            shareImage();
        });

        toggleDarkMode.addEventListener('click', () => {
            darkMode = !darkMode;
            document.body.classList.toggle('dark-mode', darkMode);
            localStorage.setItem('darkMode', darkMode);
            toggleDarkMode.querySelector('.moon').style.display = darkMode ? 'none' : 'block';
            toggleDarkMode.querySelector('.sun').style.display = darkMode ? 'block' : 'none';
        });

        generateImage();