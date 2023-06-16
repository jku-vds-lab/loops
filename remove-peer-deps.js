const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('package.json'));

const dependencies = new Set(Object.keys(packageJson.dependencies));

for (const [packageName, packageVersion] of Object.entries(packageJson.peerDependencies)) {
  if (dependencies.has(packageName)) {
    delete packageJson.peerDependencies[packageName];
    console.log(`Removed ${packageName} from peerDependencies`);
  }
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
