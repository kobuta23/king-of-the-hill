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
let mountain
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
    users = [mountain, admin, alice, bob, carol, david];

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
    const KingOfTheMountain = await ethers.getContractFactory("KingOfTheMountain", admin);
    mountain = await KingOfTheMountain.deploy(
        daix.address,  // cashToken
        army.address,  // armyToken
        (1e10).toString(), // decay
        (1e10).toString() // step
    )
    mountain.name = "mountain";
    await mountain.deployed();
    await army.transfer({receiver: mountain.address, amount: ethers.utils.parseUnits("1000000000000")}).exec(admin);
})

afterEach(async function () {
    // test on each test if app is jailed
    await noAppJailed();
});
describe("test deployment", async function () {

    it("should deploy new mountain", async () => {
        assert.equal(await mountain.cashToken(), daix.address, "cashToken should be daix");
        assert.equal(await mountain.armyToken(), army.address, "armyToken should be army");
        assert.equal(await mountain.decay(), (1e10).toString(), "decay should be 1e10");
        assert.equal(await mountain.step(), (1e10).toString(), "step should be 1e10");
        assert.equal(await mountain.king(), admin.address, "king should be admin");
    });

    // should revert if decay is not positive
    it("should revert if decay is non positive", async () => {
        const MountainFactory = await ethers.getContractFactory("KingOfTheMountain", admin)
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
        //alice streams cash to the mountain
        op = await daix.createFlow({
            receiver: mountain.address,
            flowRate: "10000000000"
        });
        await op.exec(alice);

        assert.isBelow(Number(await daix.netFlow(alice)), 0, "netflow should be negative");
        assert.isAbove(Number(await army.netFlow(alice)), 0, "netflow should be positive");
        assert.equal(Number(await daix.userFlow(alice, mountain)), 10000000000, "alice should be streaming to mountain");
        assert.equal(Number(await army.userFlow(mountain, alice)), Number(await mountain.armyFlowRate("10000000000")), "mountain should be streaming to alice");

        assert.isAbove(Number(await daix.netFlow(admin)), 0, "mountain should be streaming cash");

        await cleanUp([alice]);
        await noStreamToKing();
    });

    it("users who stream more, get more back", async function () {
        //alice streams cash to the mountain
        op = await daix.createFlow({
            receiver: mountain.address,
            flowRate: "10000000000"
        });
        await op.exec(alice);
        assert.equal(Number(await daix.userFlow(alice, mountain)), 10000000000, "alice should be streaming to mountain");
        op = await daix.createFlow({
            receiver: mountain.address,
            flowRate: "20000000000"
        });
        await op.exec(bob);
        assert.equal(Number(await daix.userFlow(bob, mountain)), 20000000000, "alice should be streaming to mountain");

        let x = Number(await army.userFlow(mountain, alice));
        let y = Number(await army.userFlow(mountain, bob));
        // console.log(`${x} vs ${y}`);
        assert.isBelow(x, y, "Bob getting more than alice")
        await cleanUp([alice, bob]);
        await noStreamToKing();
    });

    it("users streaming later get lower army flow", async function () {
        op = await daix.createFlow({
            receiver: mountain.address,
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

    // user transfer cashToken to mountain and becomes king (ERC777 callback)
    it("user transfer cashToken to mountain and becomes king (ERC777 callback)", async function () {
        // admin funds alice
        await army.transfer({receiver: alice.address, amount: ethers.utils.parseUnits("10")}).exec(admin);
        // assert that alice is not king
        assert.notEqual(await mountain.king(), alice.address, "alice is already king");
        // alice will become king
        await army.contract.connect(alice).send(
            mountain.address,
            (1e18 + 50000000).toString(),
            "0x"
        );
        // assert that alice is king
        assert.equal(await mountain.king(), alice.address, "alice is not king");
    });

    // user transfer cashToken to mountain and becomes king by calling claim
    it("user transfer cashToken to mountain and becomes king by calling claim", async function () {
        // alice becomes king by calling claim
        assert.notEqual(await mountain.king(), alice.address, "alice is already king");
        await army.transfer({receiver: alice.address, amount: ethers.utils.parseUnits("10")}).exec(admin);
        await army.approve({receiver: mountain.address, amount: ethers.utils.parseUnits("10")}).exec(alice);
        await mountain.connect(alice).claim(ethers.utils.parseUnits("2"));
        // assert that alice is king
        assert.equal(await mountain.king(), alice.address, "alice is not king");
    });

    it("user can't become king if he doesn't send enough cashToken", async function () {
        // alice becomes king by calling claim
        assert.notEqual(await mountain.king(), alice.address, "alice is already king");
        await army.transfer({receiver: alice.address, amount: ethers.utils.parseUnits("10")}).exec(admin);
        await army.approve({receiver: mountain.address, amount: ethers.utils.parseUnits("10")}).exec(alice);
        await expect(mountain.connect(alice).claim("10000")).to.be.revertedWith("send bigger army");
    });
});

describe("king taxes", async function () {

    it("outflow == sum of inflows - treasure", async function () {
        op = await daix.createFlow({
            receiver: mountain.address,
            flowRate: "10000000000"
        });


        await op.exec(alice);
        await op.exec(bob);
        await op.exec(carol);

        const kingAddress = await mountain.king();
        let taxRate = await mountain.taxRate();
        let [x, y] = await Promise.all([daix.netFlow(mountain), daix.userFlow(mountain, {address: kingAddress})]);
        assert.equal(Number(taxRate), Number(y), "king not collecting full tax amount");
        assert.equal(Number(x) + Number(y), 10000000000 * 3, "netflow isn't equal");
        await cleanUp([alice,bob,carol]);
    })

    it("check the treasure is accumulating properly", async function () {
        //alice streams cash to the mountain
        op = await daix.createFlow({
            receiver: mountain.address,
            flowRate: "10000000000"
        });

        await op.exec(alice);
        await op.exec(bob);
        await op.exec(carol);

        await pass1week(); 
        let x,y;
        x = Number(await daix.netFlow(mountain)) * 86400 * 7;
        y = Number(await daix.bal(mountain));
        // console.log(x, "  & ", y);
        assert.isAtLeast(y, x, "treasure is less than expected");
        await cleanUp([alice,bob,carol]);
    });

    it("check the treasure and taxflow move to new king", async function () {

        op = await daix.createFlow({
            receiver: mountain.address,
            flowRate: "10000000000"
        });

        await op.exec(alice);
        await op.exec(bob);
        await op.exec(carol);

        await pass1week();
        assert.isAbove(Number(await daix.bal(mountain)), 0, "treasure not accumulating");


        const aliceBeforeNetFlow = Number(await daix.netFlow(alice));
        op = await army.approve({
            receiver: mountain.address,
            amount: "20000000000"
        })
        await op.exec(alice)
        await mountain.connect(alice).claim("20000000000");
        const aliceAfterNetFlow = Number(await daix.netFlow(alice));
        // console.log(aliceBeforeNetFlow, " vs ", aliceAfterNetFlow);
        assert.isAbove(aliceAfterNetFlow, aliceBeforeNetFlow, "stream not redirected properly");
        assert.equal(Number(await daix.bal(mountain)), 0, "treasure didn't transfer completely");
        await cleanUp([alice,bob,carol]);
    });

});

// start testing interations between players and mountain
describe("interactions between players and mountain", async function () {

    // king cancel tax stream and new king conquers the mountain
    it("king cancel tax stream and new king conquers the mountain", async function () {
        // fund alice
        await army.transfer({receiver: alice.address, amount: ethers.utils.parseUnits("10")}).exec(admin);
        // fund bob
        await army.transfer({receiver: bob.address, amount: ethers.utils.parseUnits("10")}).exec(admin);

        op = await daix.createFlow({
            receiver: mountain.address,
            flowRate: "10000000000"
        });
        await op.exec(alice);
        // alice is not king
        assert.equal(await mountain.king(), admin.address, "admin is not king");
        await army.contract.connect(alice).send(
            mountain.address,
            (1e18 + 50000000).toString(),
            "0x"
        );
        //alice is king
        assert.equal(await mountain.king(), alice.address, "alice is not king");
        // assert that alice is also getting tax stream
        assert.isAbove(Number(await daix.userFlow(mountain, alice)), 0, "alice is not getting tax stream");
        // assert that alice is getting army stream
        assert.isAbove(Number(await army.userFlow(mountain, alice)), 0, "alice is not getting army stream");

        // alice stops the tax stream
        op = await daix.deleteFlow({sender: mountain.address, receiver: alice.address});
        await op.exec(alice);

        // alice is not getting daix stream
        assert.equal(Number(await daix.userFlow(mountain, alice)), 0, "alice is getting tax stream");
        // alice is getting army stream
        assert.isAbove(Number(await army.userFlow(mountain, alice)), 0, "alice is not getting army stream");

        // bob get to be king
        await army.contract.connect(bob).send(
            mountain.address,
            (2e18).toString(),
            "0x"
        );
        // bob is king
        assert.equal(await mountain.king(), bob.address, "bob is not king");
        // bob is getting tax stream
        assert.isAbove(Number(await daix.userFlow(mountain, bob)), 0, "bob is not getting tax stream");
        // bob is not getting army stream because if not paying
        assert.equal(Number(await army.userFlow(mountain, bob)), 0, "bob is getting army stream");

        // bob start paying to get bigger army
        op = await daix.createFlow({
            receiver: mountain.address,
            flowRate: "20000000000"
        });
        await op.exec(bob);

        assert.isAbove(Number(await army.userFlow(mountain, bob)), 0, "bob is not getting army stream");

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
            receiver: mountain.address
        }).exec(user);
    };
}

async function noAppJailed(){
    const jailed = await sf.host.contract.connect(admin).isAppJailed(mountain.address)
    assert.equal(jailed, false, "app is jailed");
}

async function noStreamToKing() {
    const kingAddress= await mountain.king();
    const king = {address: kingAddress};
    const stream = await daix.userFlow(mountain, king);
    assert.equal(Number(stream), 0, "stream to king");
}