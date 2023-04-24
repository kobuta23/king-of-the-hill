const { Framework } = require("@superfluid-finance/sdk-core")
const { ethers , network} = require("hardhat")
const { assert, expect } = require("chai")
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

const alotOfEth = ethers.utils.parseEther("100000");
const someEth = ethers.utils.parseEther("10000");

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
            ethers.utils.parseUnits("100000000000000000000000000000")
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

    async function userFlow(senderName, receiverName) {
        const result = await this.getFlow({
            sender: senderName.address,
            receiver: receiverName.address,
            providerOrSigner: alice
        });
        return result.flowRate;
    }

    Object.assign(daix, {netFlow, userFlow, logBal, bal});
    Object.assign(army, {netFlow, userFlow, logBal, bal});

    dai = new ethers.Contract(daix.underlyingToken.address, TestToken.abi, admin);
    users = [hill, admin, alice, bob, carol, david];

    console.log(`daix address: ${daix.address}`);
    console.log(`army address: ${army.address}`);
})

beforeEach(async function () {
    await dai.mint(admin.address, alotOfEth)
    await dai.connect(admin).approve(daix.address, alotOfEth)
    await daix.upgrade({amount: alotOfEth}).exec(admin);
  
    await daix.transfer({receiver: alice.address, amount: someEth}).exec(admin);
    await daix.transfer({receiver: bob.address, amount: someEth}).exec(admin);
    await daix.transfer({receiver: carol.address, amount: someEth}).exec(admin);
    await daix.transfer({receiver: david.address, amount: someEth}).exec(admin);

    // deploy fresh app each time
    const KingOfTheHill = await ethers.getContractFactory("KingOfTheHill", admin);
    hill = await KingOfTheHill.deploy(
        daix.address,  // cashToken
        army.address,  // armyToken
        (1e10).toString(), // decay
        (1e10).toString() // step
    )
    hill.name = "hill";
    await hill.deployed();
    await army.transfer({receiver: hill.address, amount: ethers.utils.parseUnits("1000000000000")}).exec(admin);
})

afterEach(async function () {
    // test on each test if app is jailed
    await noAppJailed();
});
describe("test deployment", async function () {

    it("should deploy new hill", async () => {
        assert.equal(await hill.cashToken(), daix.address, "cashToken should be daix");
        assert.equal(await hill.armyToken(), army.address, "armyToken should be army");
        assert.equal(await hill.decay(), (1e10).toString(), "decay should be 1e10");
        assert.equal(await hill.step(), (1e10).toString(), "step should be 1e10");
        assert.equal(await hill.king(), admin.address, "king should be admin");
    });

    // should revert if decay is not positive
    it("should revert if decay is non positive", async () => {
        const MountainFactory = await ethers.getContractFactory("KingOfTheHill", admin)
        await expect(MountainFactory.deploy(
            daix.address,  // cashToken
            army.address,  // armyToken
            "-1", // decay
            (1e10).toString()
        )).to.be.revertedWith("decay must be positive")
    });
});

describe("initial stream testing", async function () {

    it("user streams and should get a stream back", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "100000000000000"
        });
        await op.exec(alice);

        assert.isBelow(Number(await daix.netFlow(alice)), 0, "netflow should be negative");
        assert.isAbove(Number(await army.netFlow(alice)), 0, "netflow should be positive");
        assert.equal(Number(await daix.userFlow(alice, hill)), 100000000000000, "alice should be streaming to hill");
        assert.equal(Number(await army.userFlow(hill, alice)), Number(await hill.armyFlowRate("100000000000000")), "hill should be streaming to alice");

        assert.isAbove(Number(await daix.netFlow(admin)), 0, "hill should be streaming cash");

        await cleanUp([alice]);
        await noStreamToKing();
    });

    it("users who stream more, get more back", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000"
        });
        await op.exec(alice);
        assert.equal(Number(await daix.userFlow(alice, hill)), 10000000000, "alice should be streaming to hill");
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "20000000000"
        });
        await op.exec(bob);
        assert.equal(Number(await daix.userFlow(bob, hill)), 20000000000, "alice should be streaming to hill");

        let x = Number(await army.userFlow(hill, alice));
        let y = Number(await army.userFlow(hill, bob));
        // console.log(`${x} vs ${y}`);
        assert.isBelow(x, y, "Bob getting more than alice")
        await cleanUp([alice, bob]);
        await noStreamToKing();
    });

    it("users streaming later get lower army flow", async function () {
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000"
        });

        await op.exec(bob);
        await pass1week();
        await op.exec(carol);
        await pass1week();
        await op.exec(alice);

        let [x, y, z] = await Promise.all([army.netFlow(bob), army.netFlow(carol), army.netFlow(alice)]);
        // console.log(`${x} vs ${y} vs ${z}`);
        assert.isAbove(Number(x) , Number(y), "Bob isn't getting more than Carol. even tho he started earlier");
        assert.isAbove(Number(y) , Number(z), "Carol isn't getting more than Alice. even tho he started earlier");
        await cleanUp([alice, bob, carol]);
        await noStreamToKing();
    });

});

describe("became king", async function () {

    // user transfer cashToken to hill and becomes king (ERC777 callback)
    it("user transfer cashToken to hill and becomes king (ERC777 callback)", async function () {
        // admin funds alice
        await army.transfer({receiver: alice.address, amount: ethers.utils.parseUnits("10")}).exec(admin);
        // assert that alice is not king
        assert.notEqual(await hill.king(), alice.address, "alice is already king");
        // alice will become king
        await army.contract.connect(alice).send(
            hill.address,
            (1e18 + 50000000).toString(),
            "0x"
        );
        // assert that alice is king
        assert.equal(await hill.king(), alice.address, "alice is not king");
    });

    // user transfer cashToken to hill and becomes king by calling claim
    it("user transfer cashToken to hill and becomes king by calling claim", async function () {
        // alice becomes king by calling claim
        assert.notEqual(await hill.king(), alice.address, "alice is already king");
        await army.transfer({receiver: alice.address, amount: ethers.utils.parseUnits("10")}).exec(admin);
        await army.approve({receiver: hill.address, amount: ethers.utils.parseUnits("10")}).exec(alice);
        await hill.connect(alice).claim(ethers.utils.parseUnits("2"));
        // assert that alice is king
        assert.equal(await hill.king(), alice.address, "alice is not king");
    });

    it("user can't become king if he doesn't send enough cashToken", async function () {
        // alice becomes king by calling claim
        assert.notEqual(await hill.king(), alice.address, "alice is already king");
        await army.transfer({receiver: alice.address, amount: ethers.utils.parseUnits("10")}).exec(admin);
        await army.approve({receiver: hill.address, amount: ethers.utils.parseUnits("10")}).exec(alice);
        await expect(hill.connect(alice).claim("10000")).to.be.revertedWith("send bigger army");
    });
});

describe("king taxes", async function () {

    it("outflow == sum of inflows - treasure", async function () {
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000"
        });


        await op.exec(alice);
        await op.exec(bob);
        await op.exec(carol);

        const kingAddress = await hill.king();
        let taxRate = await hill.taxRate();
        let [x, y] = await Promise.all([daix.netFlow(hill), daix.userFlow(hill, {address: kingAddress})]);
        assert.equal(Number(taxRate), Number(y), "king not collecting full tax amount");
        assert.equal(Number(x) + Number(y), 10000000000 * 3, "netflow isn't equal");
        await cleanUp([alice,bob,carol]);
    })

    it("check the treasure is accumulating properly", async function () {
        //alice streams cash to the hill
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000"
        });

        await op.exec(alice);
        await op.exec(bob);
        await op.exec(carol);

        await pass1week(); 
        let x,y;
        x = Number(await daix.netFlow(hill)) * 86400 * 7;
        y = Number(await daix.bal(hill));
        // console.log(x, "  & ", y);
        assert.isAtLeast(y, x, "treasure is less than expected");
        await cleanUp([alice,bob,carol]);
    });

    it("check the treasure and taxflow move to new king", async function () {

        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000"
        });

        await op.exec(alice);
        await op.exec(bob);
        await op.exec(carol);

        await pass1week();
        assert.isAbove(Number(await daix.bal(hill)), 0, "treasure not accumulating");


        const aliceBeforeNetFlow = Number(await daix.netFlow(alice));
        op = await army.approve({
            receiver: hill.address,
            amount: "20000000000"
        })
        await op.exec(alice)
        await hill.connect(alice).claim("20000000000");
        const aliceAfterNetFlow = Number(await daix.netFlow(alice));
        // console.log(aliceBeforeNetFlow, " vs ", aliceAfterNetFlow);
        assert.isAbove(aliceAfterNetFlow, aliceBeforeNetFlow, "stream not redirected properly");
        assert.equal(Number(await daix.bal(hill)), 0, "treasure didn't transfer completely");
        await cleanUp([alice,bob,carol]);
    });

});

// start testing interations between players and hill
describe("interactions between players and hill", async function () {

    // king cancel tax stream and new king conquers the hill
    it("king cancel tax stream and new king conquers the hill", async function () {
        // fund alice
        await army.transfer({receiver: alice.address, amount: ethers.utils.parseUnits("10")}).exec(admin);
        // fund bob
        await army.transfer({receiver: bob.address, amount: ethers.utils.parseUnits("10")}).exec(admin);

        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000"
        });
        await op.exec(alice);
        // alice is not king
        assert.equal(await hill.king(), admin.address, "admin is not king");
        await army.contract.connect(alice).send(
            hill.address,
            (1e18 + 50000000).toString(),
            "0x"
        );
        //alice is king
        assert.equal(await hill.king(), alice.address, "alice is not king");
        // assert that alice is also getting tax stream
        assert.isAbove(Number(await daix.userFlow(hill, alice)), 0, "alice is not getting tax stream");
        // assert that alice is getting army stream
        assert.isAbove(Number(await army.userFlow(hill, alice)), 0, "alice is not getting army stream");

        // alice stops the tax stream
        op = await daix.deleteFlow({sender: hill.address, receiver: alice.address});
        await op.exec(alice);

        // alice is not getting daix stream
        assert.equal(Number(await daix.userFlow(hill, alice)), 0, "alice is getting tax stream");
        // alice is getting army stream
        assert.isAbove(Number(await army.userFlow(hill, alice)), 0, "alice is not getting army stream");

        // bob get to be king
        await army.contract.connect(bob).send(
            hill.address,
            (2e18).toString(),
            "0x"
        );
        // bob is king
        assert.equal(await hill.king(), bob.address, "bob is not king");
        // bob is getting tax stream
        assert.isAbove(Number(await daix.userFlow(hill, bob)), 0, "bob is not getting tax stream");
        // bob is not getting army stream because if not paying
        assert.equal(Number(await army.userFlow(hill, bob)), 0, "bob is getting army stream");

        // bob start paying to get bigger army
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "20000000000"
        });
        await op.exec(bob);
        assert.isAbove(Number(await army.userFlow(hill, bob)), 0, "bob is not getting army stream");
    });

    it("🚨hill is out of army and gets liquidated = jailed", async function () {
        // deploy fresh app each time
        const KingOfTheHill = await ethers.getContractFactory("KingOfTheHill", admin);
        const hill = await KingOfTheHill.deploy(
            daix.address,  // cashToken
            army.address,  // armyToken
            (1e10).toString(), // decay
            (1e10).toString() // step
        )
        hill.name = "hill";
        await hill.deployed();
        await army.transfer({receiver: hill.address, amount: "5000000000000000"}).exec(admin);

        // alice gets army tokens
        op = await daix.createFlow({
            receiver: hill.address,
            flowRate: "10000000000"
        });
        await op.exec(alice);
        pass1week();

        // assert alice is getting stream
        assert.isAbove(Number(await army.userFlow(hill, alice)), 0, "alice is not getting army stream");
        // stream is closed by external account
        await army.deleteFlow({sender: hill.address, receiver: alice.address}).exec(admin);
        const jailed = await sf.host.contract.connect(admin).isAppJailed(hill.address)
        assert.equal(jailed, true, "app is jailed");
    });
});

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

async function cleanUp(users, token = daix) {
    for(const user of users) {
        await token.deleteFlow({
            sender: user.address,
            receiver: hill.address
        }).exec(user);
    };
}

async function noAppJailed(){
    const jailed = await sf.host.contract.connect(admin).isAppJailed(hill.address)
    assert.equal(jailed, false, "app is jailed");
}

async function noStreamToKing() {
    const kingAddress= await hill.king();
    const king = {address: kingAddress};
    const stream = await daix.userFlow(hill, king);
    assert.equal(Number(stream), 0, "stream to king");
}