const { Framework } = require("@superfluid-finance/sdk-core")
const { ethers , network} = require("hardhat")
const { assert, expect } = require("chai")
const KingOfHillArtifact = require("../artifacts/contracts/KingOfHill.sol/KingOfHill.json")
const { deployTestFramework } = require("@superfluid-finance/ethereum-contracts/dev-scripts/deploy-test-framework");
const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json")


let contractsFramework;
let sfDeployer;
let sf
let dai
let daix
let admin
let alice
let bob
let carol
let david
let hill
let users
let op
let employmentLoan

const alotOfEth = ethers.utils.parseEther("100000")
const someEth = ethers.utils.parseEther("10000")

before(async function () {
    //get accounts from hardhat
    [admin, alice, bob, carol, david] = await ethers.getSigners();
    admin.name = "admin";
    alice.name = "alice";
    bob.name = "bob  ";
    carol.name = "carol";
    david.name = "david";

    
    sfDeployer = await deployTestFramework();
    // deploy the framework locally
    contractsFramework = await sfDeployer.getFramework();

    // initialize framework
    sf = await Framework.create({
        chainId: 31337,
        provider: admin.provider,
        resolverAddress: contractsFramework.resolver, // (empty)
        protocolReleaseVersion: "test"
    });
    
    // DEPLOYING DAI and DAI wrapper super token (which will be our `cashToken`)
    await sfDeployer.deployWrapperSuperToken(
        "Fake DAI Token",
        "fDAI",
        18,
        ethers.utils.parseEther("100000000000000000000000").toString()
    );


    // this deploys a pure super token
    await sfDeployer
        .deployPureSuperToken(
            "Army Token",
            "ARMY",
            ethers.utils.parseUnits("1000000000000")
        );

    daix = await sf.loadSuperToken("fDAIx");
    army = await sf.loadSuperToken("ARMY");
    
    async function logBal(name){
        console.log(name.name, ":", await this.balanceOf({account: name.address, providerOrSigner: alice}));
    }
    async function bal(name){
        return await this.balanceOf({account: name.address, providerOrSigner: alice});
    }
    async function netFlow(name) {
        return await this.getNetFlow({
            account: name.address,
            providerOrSigner: alice
        })
    }
    Object.assign(daix, {netFlow, logBal, bal});
    Object.assign(army, {netFlow, logBal, bal});

    daix.logBal(admin);
    daix.netFlow(admin);

    dai = new ethers.Contract(daix.underlyingToken.address, TestToken.abi, admin);

    const KingOfHill = await ethers.getContractFactory("KingOfHill", admin)
    hill = await KingOfHill.deploy(
        daix.address,  // cashToken
        army.address,  // armyToken
        (1e10).toString() // decay
    )
    hill.name = "hill "
    await hill.deployed()
    await army.transfer({receiver: hill.address, amount: ethers.utils.parseUnits("1000000000000")}).exec(admin)
    users = [hill, admin, alice, bob, carol, david];
})

beforeEach(async function () {
    await dai.mint(admin.address, alotOfEth)
    await dai.connect(admin).approve(daix.address, alotOfEth)
    await daix.upgrade({amount: alotOfEth}).exec(admin);
  
    await daix.transfer({receiver: alice.address, amount: someEth}).exec(admin);
    await daix.transfer({receiver: bob.address, amount: someEth}).exec(admin);
    await daix.transfer({receiver: carol.address, amount: someEth}).exec(admin);
    await daix.transfer({receiver: david.address, amount: someEth}).exec(admin);
})

describe("intial stream testing", async function () {
    it("user streams and should get a stream back", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000" //
        });
        try {
            await op.exec(alice);
        } catch (e){
            console.log("caught smth, ");
        }

        //cash netflowrate
        assert.isBelow(Number(await daix.netFlow(alice)), 0, "netflow should be negative")
        assert.isAbove(Number(await army.netFlow(alice)), 0, "netflow should be positive")
        await cleanUp([alice]);
    })

    it("users who stream more, get more back", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000" //
        });
        try {
            await op.exec(alice);
        } catch (e){
            console.log("caught smth, ");
        }
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "20000000000" //
        });
        try {
            await op.exec(bob);
        } catch (e){
            console.log("caught smth, ");
        }
        //cash netflowrate
        let x = Number(await army.netFlow(alice));
        let y = Number(await army.netFlow(bob));
        console.log (x, " vs ", y);
        assert.isBelow(x, y, "Bob getting more than alice")
        await cleanUp([alice, bob])
    })

    it("users streaming later get lower army flow", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000" //
        });
        try {
            await op.exec(bob);
            await pass1week();
            await op.exec(carol);
        } catch (e){
            console.log("caught smth, ");
        }

        //cash netflowrate
        let x = Number(await army.netFlow(bob));
        let y = Number(await army.netFlow(carol));
        console.log (x, " vs ", y);
        assert.isAbove(x , y, "Bob isn't getting more than carol. even tho he started earlier");
        await cleanUp([bob, carol])
    })
});
describe("kingmakers", async function () {
    it("outflow == sum of inflows - treasure", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000" //
        });
        try {
            await op.exec(alice);
            await op.exec(bob);
            await op.exec(carol);
        } catch (e){
            console.log("caught smth, ");
        }
        let x = Number(await daix.netFlow(hill));
        let y = Number(await daix.netFlow(admin));
        assert.equal(x + y, 10000000000*3, "netflow isn't equal");
        await cleanUp([alice,bob,carol]);
    })

    it("check the treasure is accumulating properly", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000" //
        });
        try {
            await op.exec(alice);
            await op.exec(bob);
            await op.exec(carol);
        } catch (e){
            console.log("caught smth, ");
        }

        await pass1week(); 
        let x,y;
        x = Number(await daix.netFlow(hill)) * 86400 * 7;
        y = Number(await daix.bal(hill));
        console.log(x, "  & ", y);
        assert.isAtLeast(y, x, "treasure is less than expected");
        await cleanUp([alice,bob,carol]);
    });

    

    it("check the treasure and taxflow move to new king", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000" //
        });
        try {
            await op.exec(alice);
            await op.exec(bob);
            await op.exec(carol);
        } catch (e){
            console.log("caught smth");
        }
        await pass1week();
        balBefore = Number(await daix.bal(hill));
        assert.isAbove(balBefore, 0, "treasure not accumulating");
        op = await army.approve({
            receiver: hill.address,
            amount: "1000000000"
        })
        aliceBeforeNetFlow = Number(await daix.netFlow(alice));
        try{
            await op.exec(alice)
        } catch (e){
            console.log("alice couldn't approve... ")
        }
        op = await hill.connect(alice).claim("1000000000");
        aliceAfterNetFlow = Number(await daix.netFlow(alice));
        console.log(aliceBeforeNetFlow, " vs ", aliceAfterNetFlow); 
        assert.isAbove(aliceAfterNetFlow, aliceBeforeNetFlow, "stream not redirected properly");
        
        assert.equal(Number(await daix.bal(hill)), 0, "treasure didn't transfer completely");
        
        await cleanUp([alice,bob,carol]);
        await cleanUp([alice], army);
    });

    
});
/*describe("fuzzing", async function () {
    it("tries a bunch of random scenarios", async function () {
        //alice streams cash to the hill
        players = [alice, bob, carol, david];

        for(let i=0;i<20;i++){
            // set up random action taker
            // 1. Open a stream of DAIx
            // 2. Check if can be 


            // invariant checks

            // 
        }
    });
});*/

async function logBals(token, users){
    console.log(`${await token.symbol({providerOrSigner: alice})} BALANCES:`)
    await users.forEach(async x => {
        await token.logBal(x); 
    });
};

async function pass1week(){
    let pass1week = 86400 * (364 / 52)
    await network.provider.send("evm_increaseTime", [pass1week])
    await network.provider.send("evm_mine")
}

async function cleanUp(users, token = daix){
    await users.forEach(async user => {
        await token.deleteFlow({
            sender: user.address,
            receiver: hill.address
        }).exec(user)
    });
}