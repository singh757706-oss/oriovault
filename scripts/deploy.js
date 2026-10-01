const hre = require('hardhat');
async function main(){
  const C=await hre.ethers.getContractFactory('OrioVaultRegistry');
  const c=await C.deploy(); await c.waitForDeployment();
  console.log('OrioVaultRegistry:', await c.getAddress());
}
main().catch(e=>{console.error(e);process.exit(1)});
