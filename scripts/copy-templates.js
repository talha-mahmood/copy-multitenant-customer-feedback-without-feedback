const fs = require('fs');
const path = require('path');

/**
 * Script to copy email templates from src to dist directory
 * This ensures all template files are available in the compiled application
 */

const srcTemplatesDir = path.join(__dirname, '..', 'src', 'modules', 'email', 'templates');
const distTemplatesDir = path.join(__dirname, '..', 'dist', 'modules', 'email', 'templates');

// Create dist templates directory if it doesn't exist
if (!fs.existsSync(distTemplatesDir)) {
  fs.mkdirSync(distTemplatesDir, { recursive: true });
}

// Copy all .hbs files from src to dist
if (fs.existsSync(srcTemplatesDir)) {
  const files = fs.readdirSync(srcTemplatesDir);
  
  files.forEach(file => {
    if (file.endsWith('.hbs')) {
      const srcFile = path.join(srcTemplatesDir, file);
      const distFile = path.join(distTemplatesDir, file);
      
      try {
        fs.copyFileSync(srcFile, distFile);
        console.log(`✅ Copied ${file} to dist directory`);
      } catch (error) {
        console.error(`❌ Failed to copy ${file}:`, error.message);
      }
    }
  });
  
  console.log('🎉 Template copying completed!');
} else {
  console.error('❌ Source templates directory not found:', srcTemplatesDir);
}
