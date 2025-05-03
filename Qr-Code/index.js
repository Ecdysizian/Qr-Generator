
        document.addEventListener('DOMContentLoaded', function () {
            // Tab switching
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.getAttribute('data-tab');

                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                });
            });

            // PDF file size check
            const pdfInput = document.getElementById('pdfInput');
            const pdfSizeWarning = document.getElementById('pdfSizeWarning');
            
            pdfInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const fileSize = this.files[0].size / 1024; // size in KB
                    
                    if (fileSize > 500) {
                        pdfSizeWarning.style.display = 'block';
                    } else {
                        pdfSizeWarning.style.display = 'none';
                    }
                }
            });

            // Color swatches
            const colorPicker = document.getElementById('colorPicker');
            const colorSwatches = document.querySelectorAll('.color-swatch');
            let currentData = '';
            let pdfDataUrl = '';
            let currentName = '';
            let currentSize = 256;
            let currentColor = '#000000';

            colorSwatches.forEach(swatch => {
                swatch.addEventListener('click', () => {
                    const color = swatch.getAttribute('data-color');
                    colorPicker.value = color;
                    currentColor = color;
                    colorSwatches.forEach(s => s.classList.remove('selected'));
                    swatch.classList.add('selected');
                    if (currentData) {
                        generateQRWithData(currentData, currentName, currentSize, currentColor);
                    }
                });
            });

            colorPicker.addEventListener('change', () => {
                currentColor = colorPicker.value;
                colorSwatches.forEach(swatch => {
                    if (swatch.getAttribute('data-color') === currentColor) {
                        swatch.classList.add('selected');
                    } else {
                        swatch.classList.remove('selected');
                    }
                });
                if (currentData) {
                    generateQRWithData(currentData, currentName, currentSize, currentColor);
                }
            });

            // Convert PDF to base64
            function readFileAsDataURL(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(file);
                });
            }

            // Generate QR Code
            const generateBtn = document.getElementById('generateBtn');
            const resultContainer = document.getElementById('resultContainer');
            const qrResult = document.getElementById('qrResult');
            const downloadBtn = document.getElementById('downloadBtn');
            const pdfLoading = document.getElementById('pdfLoading');

            generateBtn.addEventListener('click', async () => {
                generateBtn.classList.add('loading');
                await generateQRCode();
                generateBtn.classList.remove('loading');
            });

            async function generateQRCode() {
                // Clear previous errors
                document.querySelectorAll('.error-msg').forEach(el => (el.style.display = 'none'));

                // Get common values
                currentName = document.getElementById('qrName').value || 'MyQRCode';
                currentSize = parseInt(document.getElementById('qrSize').value);
                currentColor = document.getElementById('colorPicker').value;

                // Determine which tab is active
                const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
                let isValid = true;

                if (activeTab === 'url') {
                    currentData = document.getElementById('urlInput').value;
                    if (!currentData || !isValidUrl(currentData)) {
                        document.getElementById('urlError').style.display = 'block';
                        isValid = false;
                    }
                } else if (activeTab === 'text') {
                    currentData = document.getElementById('textInput').value;
                    if (!currentData) {
                        document.getElementById('textError').style.display = 'block';
                        isValid = false;
                    }
                } else if (activeTab === 'pdf') {
                    const pdfInput = document.getElementById('pdfInput');
                    if (!pdfInput.files || !pdfInput.files[0]) {
                        document.getElementById('pdfError').style.display = 'block';
                        isValid = false;
                    } else {
                        const pdfFile = pdfInput.files[0];
                        
                        // Show loading indicator
                        pdfLoading.style.display = 'block';
                        
                        try {
                            // Convert PDF to data URL
                            pdfDataUrl = await readFileAsDataURL(pdfFile);
                            currentData = pdfDataUrl;
                        } catch (error) {
                            console.error("Error processing PDF:", error);
                            document.getElementById('pdfError').textContent = "Error processing PDF file";
                            document.getElementById('pdfError').style.display = 'block';
                            isValid = false;
                        } finally {
                            // Hide loading indicator
                            pdfLoading.style.display = 'none';
                        }
                    }
                }

                if (isValid) {
                    await generateQRWithData(currentData, currentName, currentSize, currentColor);
                    resultContainer.style.display = 'flex';
                }
            }

            async function generateQRWithData(data, name, size, color) {
                qrResult.innerHTML = '';

                const options = {
                    text: data,
                    width: size,
                    height: size,
                    colorDark: color,
                    colorLight: "#ffffff00",
                    correctLevel: QRCode.CorrectLevel.H
                };

                new QRCode(qrResult, options);

                qrResult.style.width = `${size}px`;
                qrResult.style.height = `${size}px`;

                setupDownload(name);
                setupPreview(data);
            }

            function setupDownload(fileName) {
                downloadBtn.onclick = function () {
                    const qrImg = qrResult.querySelector('img');
                    if (qrImg) {
                        fetch(qrImg.src)
                            .then(response => response.blob())
                            .then(blob => {
                                saveAs(blob, `${fileName}.png`);
                            });
                    }
                };
            }

            function setupPreview(data) {
                const previewBtn = document.getElementById('previewBtn');
                previewBtn.onclick = function () {
                    if (data.startsWith('data:application/pdf')) {
                        // For PDF data URLs
                        const newWindow = window.open();
                        if (newWindow) {
                            newWindow.document.write(`
                                <iframe src="${data}" width="100%" height="100%" style="border: none;"></iframe>
                            `);
                        } else {
                            alert('Pop-up blocked! Please allow pop-ups for this site to preview PDF.');
                        }
                    } else if (isValidUrl(data)) {
                        window.open(data, '_blank');
                    } else {
                        alert('Preview Content:\n\n' + data);
                    }
                };
            }

            function isValidUrl(string) {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            }
        });