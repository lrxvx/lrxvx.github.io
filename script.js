document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const imageInput = document.getElementById('imageInput');
    const fileNameElement = document.getElementById('fileName');
    const imagePreview = document.getElementById('imagePreview');
    const previewContainer = document.getElementById('previewContainer');
    const optionsSection = document.getElementById('optionsSection');
    const sliceButton = document.getElementById('sliceButton');
    const resultSection = document.getElementById('resultSection');
    const resultGallery = document.getElementById('resultGallery');
    const downloadAllButton = document.getElementById('downloadAllButton');
    const resetButton = document.getElementById('resetButton');
    const ratioWidth = document.getElementById('ratioWidth');
    const ratioHeight = document.getElementById('ratioHeight');
    
    // Variables
    let originalImage = null;
    let slicedImages = [];
    
    // Event listeners
    imageInput.addEventListener('change', handleImageSelect);
    sliceButton.addEventListener('click', sliceImage);
    downloadAllButton.addEventListener('click', downloadAllImages);
    resetButton.addEventListener('click', resetApp);
    
    // Radio button listeners for predefined ratios
    document.querySelectorAll('input[name="ratio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value) {
                const [w, h] = this.value.split(':');
                ratioWidth.value = w;
                ratioHeight.value = h;
            }
        });
    });
    
    // Functions
    function handleImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('图片大小不能超过10MB');
            return;
        }
        
        // Display file name
        fileNameElement.textContent = file.name;
        
        // Create FileReader to load the image
        const reader = new FileReader();
        reader.onload = function(event) {
            // Create an image element to get dimensions
            const img = new Image();
            img.onload = function() {
                originalImage = {
                    element: img,
                    width: img.width,
                    height: img.height,
                    src: event.target.result
                };
                
                // Display image preview
                imagePreview.src = event.target.result;
                imagePreview.classList.remove('hidden');
                previewContainer.style.display = 'block';
                
                // Show options
                optionsSection.classList.remove('hidden');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    function sliceImage() {
        // Clear previous results
        resultGallery.innerHTML = '';
        slicedImages = [];
        
        // Get ratio values
        const aspectWidth = parseInt(ratioWidth.value) || 3;
        const aspectHeight = parseInt(ratioHeight.value) || 4;
        
        if (!originalImage) return;
        
        // Calculate optimal slicing
        const slices = calculateOptimalSlices(originalImage.width, originalImage.height, aspectWidth, aspectHeight);
        
        // Create sliced images
        createSlicedImages(slices);
        
        // Show results section
        resultSection.classList.remove('hidden');
    }
    
    function calculateOptimalSlices(imgWidth, imgHeight, targetRatioWidth, targetRatioHeight) {
        const targetRatio = targetRatioWidth / targetRatioHeight;
        const slices = [];
        
        // If the image's aspect ratio is close to the target, just use the whole image
        const imgRatio = imgWidth / imgHeight;
        const ratioDiff = Math.abs(imgRatio - targetRatio);
        
        if (ratioDiff < 0.1) {
            slices.push({
                x: 0,
                y: 0,
                width: imgWidth,
                height: imgHeight
            });
            return slices;
        }
        
        // For wide images (landscape), slice horizontally
        if (imgRatio > targetRatio) {
            const sliceHeight = imgHeight;
            const sliceWidth = Math.round(sliceHeight * targetRatio);
            let x = 0;
            
            while (x + sliceWidth <= imgWidth) {
                slices.push({
                    x: x,
                    y: 0,
                    width: sliceWidth,
                    height: sliceHeight
                });
                
                // Add some overlap for better slicing
                const stepSize = Math.max(sliceWidth - 100, sliceWidth / 2);
                x += Math.floor(stepSize);
                
                // Don't create too many slices
                if (slices.length >= 10) break;
            }
            
            // Add the last slice if there's space left
            if (slices.length < 10 && imgWidth - x > sliceWidth / 2) {
                slices.push({
                    x: imgWidth - sliceWidth,
                    y: 0,
                    width: sliceWidth,
                    height: sliceHeight
                });
            }
        } 
        // For tall images (portrait), slice vertically
        else {
            const sliceWidth = imgWidth;
            const sliceHeight = Math.round(sliceWidth / targetRatio);
            let y = 0;
            
            while (y + sliceHeight <= imgHeight) {
                slices.push({
                    x: 0,
                    y: y,
                    width: sliceWidth,
                    height: sliceHeight
                });
                
                // Add some overlap for better slicing
                const stepSize = Math.max(sliceHeight - 100, sliceHeight / 2);
                y += Math.floor(stepSize);
                
                // Don't create too many slices
                if (slices.length >= 10) break;
            }
            
            // Add the last slice if there's space left
            if (slices.length < 10 && imgHeight - y > sliceHeight / 2) {
                slices.push({
                    x: 0,
                    y: imgHeight - sliceHeight,
                    width: sliceWidth,
                    height: sliceHeight
                });
            }
        }
        
        return slices;
    }
    
    function createSlicedImages(slices) {
        // Create a canvas element for slicing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        slices.forEach((slice, index) => {
            // Set canvas dimensions to slice dimensions
            canvas.width = slice.width;
            canvas.height = slice.height;
            
            // Draw the slice from the original image
            ctx.drawImage(
                originalImage.element,
                slice.x, slice.y, slice.width, slice.height,
                0, 0, slice.width, slice.height
            );
            
            // Get data URL of the slice
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // Create an image element for display
            const img = new Image();
            img.src = dataUrl;
            
            // Add to sliced images array
            slicedImages.push({
                dataUrl: dataUrl,
                width: slice.width,
                height: slice.height,
                filename: `slice_${index + 1}.jpg`
            });
            
            // Create a result item and add to gallery
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const imgElement = document.createElement('img');
            imgElement.src = dataUrl;
            resultItem.appendChild(imgElement);
            
            const downloadButton = document.createElement('button');
            downloadButton.textContent = '下载';
            downloadButton.addEventListener('click', () => {
                downloadImage(dataUrl, `slice_${index + 1}.jpg`);
            });
            resultItem.appendChild(downloadButton);
            
            resultGallery.appendChild(resultItem);
        });
    }
    
    function downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function downloadAllImages() {
        slicedImages.forEach(image => {
            downloadImage(image.dataUrl, image.filename);
        });
    }
    
    function resetApp() {
        // Clear the file input
        imageInput.value = '';
        fileNameElement.textContent = '';
        
        // Hide sections
        imagePreview.classList.add('hidden');
        optionsSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        
        // Clear results
        resultGallery.innerHTML = '';
        
        // Reset variables
        originalImage = null;
        slicedImages = [];
    }
});