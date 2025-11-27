require('dotenv').config();

console.log('🔍 Validating Cloudinary credentials...');
console.log('');

// Check each environment variable
const requiredVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET'
];

let allValid = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: Missing or empty`);
    allValid = false;
  } else if (value.includes('your_') || value.includes('example')) {
    console.log(`⚠️  ${varName}: Contains placeholder text`);
    console.log(`   Current: ${value}`);
    allValid = false;
  } else if (value.startsWith(' ') || value.endsWith(' ')) {
    console.log(`⚠️  ${varName}: Has leading/trailing spaces`);
    console.log(`   Current: "${value}"`);
    allValid = false;
  } else {
    const masked = varName.includes('SECRET') 
      ? value.substring(0, 8) + '...'
      : value.substring(0, 10) + '...';
    console.log(`✅ ${varName}: ${masked}`);
  }
});

console.log('');

if (allValid) {
  console.log('🎉 All credentials appear to be valid!');
  console.log('');
  console.log('📝 Common issues:');
  console.log('   • API Secret copied incorrectly (check for extra characters)');
  console.log('   • Account not verified');
  console.log('   • API keys disabled');
  console.log('');
  console.log('🧪 Try testing again:');
  console.log('   npm run test-cloudinary');
} else {
  console.log('❌ Please fix the issues above and try again');
  console.log('');
  console.log('📖 Setup guide: CLOUDINARY_SETUP.md');
}
