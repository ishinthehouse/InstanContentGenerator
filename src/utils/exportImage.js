import html2canvas from 'html2canvas';

export const downloadPostImage = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Retina quality
      useCORS: true, // Allow cross-origin images to be drawn
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const dataUrl = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-post.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export image:', err);
    throw err;
  }
};
