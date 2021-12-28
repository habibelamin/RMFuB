const express = require('express');
const bodyParser = require('body-parser');
const { exists } = require('express-validator');


const app = express();
// app.use(bodyParser.json());
const cors = require('cors');


// configs for cors and others
app.use(cors());
app.options('*', cors());

// Setting for Hyperledger Fabric
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { json } = require('body-parser');
const ccpPath = path.resolve(__dirname, '.', 'connection.json');
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    // res.setHeader('Content-Range','risks 0-10/20');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


app.use(express.json());

//----------------------------------------------------------Organizations----------------------------------------------
app.get('/api/organizations', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        var obj = ccp.organizations;
        var re = [];
        for (var i in obj)
            re.push(obj[i].mspid);
        // var slag = [];
        // var data = ccp.organizations;
        // for(var i=0; i < data.length; i++){
        //     slag.push(Object.values(data[i]));
        // }
        res.json(re)
    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });
    }
});
// ---------------------------------------------------------Risk--------------------------------------------------------
app.get('/api/risks', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        var result = [];
        var filter = [];
        try {
            var filter = JSON.parse(req.query.filter);
        } catch {

        }
        console.log(filter);
        switch (true) {
            case (typeof filter.id !== 'undefined'):
                if (filter.id === "") {
                    res.setHeader('X-Total-Count', 0);
                    res.json([]);
                    break;
                }

                if (Array.isArray(filter.id)) {
                    try {
                        for (var i = 0; i < (filter.id).length; i++) {
                            try {
                                // console.log(collection[i]['name']);
                                const r = await contract.evaluateTransaction('QueryRisk', filter.id[i]);
                                result.push(r);
                            } catch {

                            }

                        }

                        // result = await contract.evaluateTransaction('QueryMitigation', filter.mdid);
                        // console.log(result);
                        res.setHeader('X-Total-Count', result.length);
                        res.json(JSON.parse("[" + result.toString() + "]"));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        // res.status(500).json({error: error});
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                else {
                    try {
                        result = await contract.evaluateTransaction('QueryRisk', filter.id);
                        res.setHeader('X-Total-Count', 1);
                        res.json(JSON.parse(result.toString()));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        res.json({});
                    }
                }
                break;
            default:
                result = await contract.evaluateTransaction('GetRisksByRange', 'RISK1', '');
                res.setHeader('X-Total-Count', (JSON.parse(result.toString()).length));
                res.json(JSON.parse(result.toString()));
        }


        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // // res.status(200).json({response: result.toString()});
        // res.setHeader('X-Total-Count',(JSON.parse(result.toString())).length);
        // res.json( JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ error: err });
        //process.exit(1);
    }
});

app.get('/api/risks/:RM_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('QueryRisk', req.params.RM_index);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // res.status(200).json({response: result.toString()});
        res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });

        //process.exit(1);
    }
});
app.delete('/api/risks/:RM_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        await contract.submitTransaction('DeleteRisk', req.params.RM_index);
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');
        res.json({ message: 'Transaction (DeleteRisk) has been submitted.' });
        // res.status(200).json({response: result.toString()});
        // res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });

        //process.exit(1);
    }
});
app.post('/api/risks', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('AssessRisk', req.body.uuid,req.body.rname, req.body.rdescription || '', req.body.acceptance, req.body.likelihood, req.body.impact, req.body.assessment.aid, Date.now());
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            res.json(JSON.parse(event.payload.toString("utf-8")));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');


        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to submit transaction: ${err}`);
        res.json({ status: false, error: err });
        //process.exit(1);
    }
});

app.post('/api/risks/:RM_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('EditRisk', req.params.RM_index, req.body.rname, req.body.rdescription||'', req.body.acceptance, req.body.likelihood, req.body.impact, req.body.assessment.aid);
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            res.json(JSON.parse(event.payload.toString("utf-8")));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');


        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to submit transaction: ${err}`);
        res.json({ status: false, error: err });
        //process.exit(1);
    }
});

app.put('/api/risks/:RM_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('TransferRisk', req.params.RM_index, JSON.stringify(req.body.org));
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            res.json(JSON.parse(event.payload.toString("utf-8")));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to submit transaction: ${err}`);
        res.json({ status: false, error: err });
        //process.exit(1);
    }
});

// app.put('/api/transferrisk/', async function (req, res) {
//     try {

//         let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
//         // Create a new file system based wallet for managing identities.
//         const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
//         const wallet = await Wallets.newFileSystemWallet(walletPath);
//         console.log(`Wallet path: ${walletPath}`);

//         // Check to see if we've already enrolled the user.
//         const identity = await wallet.get('supervisor');
//         if (!identity) {
//             console.log('An identity for the user "riskmanager2" does not exist in the wallet');
//             console.log('Run the registerUser.js application before retrying');
//             return;
//         }

//         // Create a new gateway for connecting to our peer node.
//         const gateway = new Gateway();
//         await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

//         // Get the network (channel) our contract is deployed to.
//         const network = await gateway.getNetwork('rmchannel');

//         // Get the contract from the network.
//         const contract = network.getContract('RM');

//         // Submit the specified transaction.
//         // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
//         // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
//         await contract.submitTransaction('TransferRisk', req.body.RM_index, req.body.info);
//         const listener = await contract.addContractListener(async (event) => {

//             console.log(event.eventName,"- "+ event.payload.toString("utf-8"));
//             res.json(JSON.parse(event.payload.toString("utf-8")));
//             return;
//         });
//         console.log('Transaction has been submitted');
//         // res.send('Transaction has been submitted');

//         // Disconnect from the gateway.
//         await gateway.disconnect();

//     } catch (err) {
//         console.error(`Failed to submit transaction: ${err}`);
//         res.json({status: false, error: err});
//          //process.exit(1);
//     }
// });

//-----------------------------------------------------------------Mitigation----------------------------------------------------------
app.post('/api/mitigations', async function (req, res) {
    try {


        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        // await contract.submitTransaction('CreateMitigation','mit5','helo','supervisor','now','RISK1:hi:0.3:0.2;');
        // if (req.body.riskdeps) {
        //     console.log("here")
        // }
        // console.log(JSON.stringify(req.body.riskdeps));
        // console.log(req.body.mname);
        // console.log(req.body.mdescription);
        // console.log(req.body.avresponsible);
        // console.log(req.body.time);
        await contract.submitTransaction('CreateMitigation', req.body.uuid, req.body.mname, req.body.mdescription || '', req.body.avresponsible, Date.now(), JSON.stringify(req.body.riskdeps) || '');
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            res.json(JSON.parse(event.payload.toString("utf-8")));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');


        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to submit transaction: ${err}`);
        res.json({ error: err });
        // process.exit(1);
    }
});
app.put('/api/mitigations/:mitigation_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        if (req.body.mstatus == "APPROVED") {
            await contract.submitTransaction('ApproveMitigation', req.params.mitigation_index);
        }
        else {
            await contract.submitTransaction('EditMitigation', req.params.mitigation_index, req.body.mname, req.body.mdescription || '', req.body.avresponsible, Date.now(), JSON.stringify(req.body.riskdeps) || '');
        }
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            res.json(JSON.parse(event.payload.toString("utf-8")));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');


        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to submit transaction: ${err}`);
        res.json({ status: false, error: err });
        // process.exit(1);
    }
});
app.get('/api/mitigations', async function (req, res) {
    try {
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');
        var result = [];
        var filter = [];
        try {
            var filter = JSON.parse(req.query.filter);
        } catch {

        }
        console.log(filter);
        switch (true) {
            case (typeof filter.rdid !== 'undefined'):
                if (filter.rdid === "") {
                    res.setHeader('X-Total-Count', 0);
                    res.json([]);
                    break;
                }
                if (Array.isArray(filter.rdid)) {
                    try {
                        for (var i = 0; i < (filter.rdid).length; i++) {
                            try {
                                // console.log(collection[i]['name']);
                                const r = await contract.evaluateTransaction('QueryMitigationsByRiskId', filter.rdid[i]);
                                result.push(r);
                            } catch { }
                        }

                        // result = await contract.evaluateTransaction('QueryMitigation', filter.mdid);
                        // console.log(result);
                        res.setHeader('X-Total-Count', result.length);
                        res.json(JSON.parse("[" + result.toString() + "]"));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        // res.status(500).json({error: error});
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                else {
                    try {
                        result = await contract.evaluateTransaction('QueryMitigationsByRiskId', filter.rdid);
                        res.setHeader('X-Total-Count', 1);
                        res.json(JSON.parse(result.toString()));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                break;

            case ((typeof filter.id !== 'undefined') && (filter.id !== "")):

                if (Array.isArray(filter.id)) {
                    try {
                        for (var i = 0; i < (filter.id).length; i++) {
                            try {
                                // console.log(collection[i]['name']);
                                const r = await contract.evaluateTransaction('QueryMitigation', filter.id[i]);
                                result.push(r);
                            }
                            catch { }
                        }

                        // result = await contract.evaluateTransaction('QueryMitigation', filter.mdid);
                        // console.log(result);
                        res.setHeader('X-Total-Count', result.length);
                        res.json(JSON.parse("[" + result.toString() + "]"));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        // res.status(500).json({error: error});
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                else {
                    try {
                        result = await contract.evaluateTransaction('QueryMitigation', filter.id);
                        res.setHeader('X-Total-Count', 1);
                        res.json(JSON.parse(result.toString()));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        res.json({});
                    }
                }
                break;
            default:
                result = await contract.evaluateTransaction('GetMitigationsByRange', 'MITIGATION1', '');
                res.setHeader('X-Total-Count', (JSON.parse(result.toString()).length));
                res.json(JSON.parse(result.toString()));
        }
        console.log(`Transaction has been evaluated, result is: ${result}`);
        // res.status(200).json({response: result.toString()});

        // res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ error: err });
        // process.exit(1);
    }
});

app.get('/api/mitigations/:mitigation_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('QueryMitigation', req.params.mitigation_index);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // res.status(200).json({response: result.toString()});
        res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });

        //process.exit(1);
    }
});


app.delete('/api/mitigations/:mitigation_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        await contract.submitTransaction('DeleteMitigation', req.params.mitigation_index);
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');
        res.json({ message: 'Transaction (DeleteMitigation) has been submitted.' });
        // res.status(200).json({response: result.toString()});
        // res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });

        //process.exit(1);
    }
});
// ------------------------------------------------------------SecurityControl---------------------------------
app.post('/api/securitycontrols/', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        // await contract.submitTransaction('CreateMitigation','mit5','helo','supervisor','now','RISK1:hi:0.3:0.2;');
        await contract.submitTransaction('CreateSecurityControl', req.body.uuid, req.body.sname, req.body.sdescription || '', req.body.apresponsible, req.body.supid || '', req.body.mdid || '');
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            res.json(JSON.parse(event.payload.toString("utf-8")));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to submit transaction: ${err}`);
        res.json({ status: false, error: err });
        // process.exit(1);
    }
});
app.put('/api/securitycontrols/:securitycontrol_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        if (req.body.sstatus == "APPLIED") {
            await contract.submitTransaction('ApplySecurityControl', req.params.securitycontrol_index);
        }
        else {
            await contract.submitTransaction('EditSecurityControl', req.params.securitycontrol_index, req.body.name, req.body.description, req.body.applyeresponsible, req.body.supid, req.body.mitigationid);
        }
        const listener = await contract.addContractListener(async (event) => {

            console.log(event.eventName, "- " + event.payload.toString("utf-8"));
            res.json(JSON.parse(event.payload.toString("utf-8")));
            return;
        });
        console.log('Transaction has been submitted');
        // res.send('Transaction has been submitted');


        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to submit transaction: ${err}`);
        res.json({ status: false, error: err });
    }
});

app.get('/api/securitycontrols', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        var result = [];
        var filter = [];
        try {
            var filter = JSON.parse(req.query.filter);
        } catch {

        }

        switch (true) {
            
            case (typeof filter.id !== 'undefined'):
                if (filter.id === "") {
                    res.setHeader('X-Total-Count', 0);
                    res.json([]);
                    break;
                }

                if (Array.isArray(filter.id)) {
                    try {
                        for (var i = 0; i < (filter.scid).length; i++) {
                            try {
                                // console.log(collection[i]['name']);
                                const r = await contract.evaluateTransaction('QuerySecurityControl', filter.id[i]);
                                result.push(r);
                            } catch { }
                        }

                        // result = await contract.evaluateTransaction('QueryMitigation', filter.mdid);
                        // console.log(result);
                        res.setHeader('X-Total-Count', result.length);
                        res.json(JSON.parse("[" + result.toString() + "]"));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        // res.status(500).json({error: error});
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                else {
                    try {
                        result = await contract.evaluateTransaction('QuerySecurityControl', filter.id);
                        res.setHeader('X-Total-Count', 1);
                        res.json(JSON.parse(result.toString()));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        res.json({});
                    }
                }
                break

            case (typeof filter.supid !== 'undefined'):
                if (filter.supid === "") {
                    res.setHeader('X-Total-Count', 0);
                    res.json([]);
                    break;
                }
                if (Array.isArray(filter.supid)) {
                    try {
                        for (var i = 0; i < (filter.supid).length; i++) {
                            try {
                                // console.log(collection[i]['name']);
                                const r = await contract.evaluateTransaction('QuerySecurityControlBySupId', filter.supid[i]);
                                result.push(r);
                            } catch { }
                        }

                        // result = await contract.evaluateTransaction('QueryMitigation', filter.mdid);
                        // console.log(result);
                        res.setHeader('X-Total-Count', result.length);
                        res.json(JSON.parse("[" + result.toString() + "]"));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        // res.status(500).json({error: error});
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                else {
                    try {
                        result = await contract.evaluateTransaction('QuerySecurityControlBySupId', filter.supid);
                        res.setHeader('X-Total-Count', 1);
                        res.json(JSON.parse(result.toString()));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                break;
            case (typeof filter.mdid !== 'undefined'):
                if (filter.mdid === "") {
                    res.setHeader('X-Total-Count', 0);
                    res.json([]);
                    break;
                }
                if (Array.isArray(filter.mdid)) {
                    try {
                        for (var i = 0; i < (filter.mdid).length; i++) {
                            try {
                                // console.log(collection[i]['name']);
                                var r = await contract.evaluateTransaction('QuerySecurityControlByMitId', filter.mdid[i]);
                                result.push(r);
                            } catch { }
                        }

                        // result = await contract.evaluateTransaction('QueryMitigation', filter.mdid);
                        // console.log(result);
                        res.setHeader('X-Total-Count', result.length);
                        res.json(JSON.parse("[" + result.toString() + "]"));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        // res.status(500).json({error: error});
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                else {
                    try {
                        result = await contract.evaluateTransaction('QuerySecurityControlByMitId', filter.mdid);
                        res.setHeader('X-Total-Count', 1);
                        res.json(JSON.parse(result.toString()));

                    } catch (err) {
                        console.error(`Failed to evaluate transaction: ${err}`);
                        res.setHeader('X-Total-Count', 0);
                        res.json([]);
                    }
                }
                break
            default:
                console.log(filter);
                result = await contract.evaluateTransaction('GetSecurityControlsByRange', 'SECURITYCONTROL1', '');
                res.setHeader('X-Total-Count', (JSON.parse(result.toString()).length));
                res.json(JSON.parse(result.toString()));
        }
        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        // const result = await contract.evaluateTransaction('GetSecurityControlsByRange', 'SECURITYCONTROL1', '');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // // res.status(200).json({response: result.toString()});
        // res.setHeader('X-Total-Count',(JSON.parse(result.toString())).length);
        // res.json( JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        // res.setHeader('X-Total-Count', 0);
        res.json({ error: err });
        // res.json({ status: false, error: err });
    }
});

app.get('/api/securitycontrols/:securitycontrol_index', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('QuerySecurityControl', req.params.securitycontrol_index);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // res.status(200).json({response: result.toString()});
        res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });
    }
});
// ----------------------------------------------------------------------------------Monitor--------------------------------------------------------------------------
app.get('/api/monitor/securitycontrols', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        var result = [];
        const collectionfile = fs.readFileSync('../../RM_collection_config.json', 'utf8')
        const collection = JSON.parse(collectionfile.toString());
        for (var i = 3; i < collection.length; i++) {
            // console.log(collection[i]['name']);
            const r = await contract.evaluateTransaction('MonitorSecurityControlsByRange', 'SECURITYCONTROL1', '', collection[i]['name']);
            result=result.concat(JSON.parse(r));
            // console.log(result);
            // for(var j=0; j< r.length;j++)
            // { 
            //     // console.log(r[j]);
            //     result.push(JSON.parse(r[j]).toString());
            // }
        }
        // result=JSON.parse(result);

        console.log(JSON.stringify(result));
        result=JSON.stringify(result);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // res.status(200).json({response: result.toString()});
        res.setHeader('X-Total-Count', (JSON.parse(result.toString())).length);
        res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });
    }
});
app.get('/api/monitor/mitigations', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');

        // Get the contract from the network.
        const contract = network.getContract('RM');
        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        // const result = await contract.evaluateTransaction('MonitorMitigationsByRange', 'MITIGATION1', '');
        var result = [];
        const collectionfile = fs.readFileSync('../../RM_collection_config.json', 'utf8')
        const collection = JSON.parse(collectionfile.toString());
        for (var i = 3; i < collection.length; i++) {
            // console.log(collection[i]['name']);
            const r = await contract.evaluateTransaction('MonitorMitigationsByRange', 'MITIGATION1', '', collection[i]['name']);
            result=result.concat(JSON.parse(r));
            // console.log(result);
            // for(var j=0; j< r.length;j++)
            // { 
            //     // console.log(r[j]);
            //     result.push(JSON.parse(r[j]).toString());
            // }
        }
        // result=JSON.parse(result);

        console.log(JSON.stringify(result));
        result=JSON.stringify(result);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // res.status(200).json({response: result.toString()});
        res.setHeader('X-Total-Count', (JSON.parse(result.toString())).length);
        res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });
        // process.exit(1);
    }
});
app.get('/api/monitor/risks', async function (req, res) {
    try {

        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org0.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('supervisor');
        if (!identity) {
            console.log('An identity for the user "riskmanager2" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'supervisor', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('rmchannel');
        // Get the contract from the network.
        const contract = network.getContract('RM');
        var result=[];
        const collectionfile = fs.readFileSync('../../RM_collection_config.json', 'utf8')
        const collection = JSON.parse(collectionfile.toString());
        for (var i = 3; i < collection.length; i++) {
            // console.log(collection[i]['name']);
            var r = await contract.evaluateTransaction('MonitorRisksByRange', 'RISK1', '', collection[i]['name']);
            // result=result.concat(r);
            // r=JSON.parse(r.toString());
            // result.push(JSON.parse(r));
            result=result.concat(JSON.parse(r));
            // console.log(result);
            // for(var j=0; j< r.length;j++)
            // { 
            //     // console.log(r[j]);
            //     result.push(JSON.parse(r[j]).toString());
            // }
        }
        // result=JSON.parse(result);

        console.log(JSON.stringify(result));
        result=JSON.stringify(result);
        // console.log(JSON.parse(result.toString()));
        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        // const result1 = await contract.evaluateTransaction('MonitorRisksByRange', 'RISK1','', 'org0-rm-com');
        // const result2 = await contract.evaluateTransaction('MonitorRisksByRange', 'RISK1','', 'org0-rm-com');
        // const result3 = await contract.evaluateTransaction('MonitorRisksByRange', 'RISK1','', 'org0-rm-com');

        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // res.status(200).json({response: result.toString()});
        res.setHeader('X-Total-Count', (JSON.parse(result.toString())).length);
        res.json(JSON.parse(result.toString()));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        // res.status(500).json({error: error});
        res.json({ status: false, error: err });
        //process.exit(1);
    }
});





app.listen(3005, () => {
    console.log('REST Server listening on port 3005');
});