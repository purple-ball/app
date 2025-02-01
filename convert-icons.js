const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const convertSvgToPng = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .resize(48, 48)
      .png()
      .toFile(outputPath);
    console.log(`Converted ${inputPath} to ${outputPath}`);
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error);
  }
};

const processDirectory = async (dir) => {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const inputPath = path.join(dir, file);
    const stat = fs.statSync(inputPath);
    
    if (stat.isDirectory()) {
      await processDirectory(inputPath);
    } else if (file.endsWith('.svg')) {
      const outputPath = inputPath.replace('.svg', '.png');
      await convertSvgToPng(inputPath, outputPath);
    }
  }
};

// 转换所有图标
processDirectory('./miniprogram/images'); 