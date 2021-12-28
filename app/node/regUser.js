/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
var args = process.argv.slice(2);
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '.', 'connection.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca1.org2.rm'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join('../../../vars/profiles/vscode/wallets', 'org2.rm');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(args[0]);
        if (userIdentity) {
            console.log('An identity for the user '+args[0]+' already exists in the wallet');
            return;
        }
        
        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        //Create New Affiliation 
        try{
            await ca.newAffiliationService().create({ "name": "org2.department1",force: true }, adminUser);
        
        }
        catch(error) {
            console.log(`Failed: ${error}`)

        }
        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: 'org2.department1',
            
            enrollmentID: args[0],
            role: 'client',
            // ,
            attrs: [{ name: "role", value: args[1], ecert: true }]
        }, adminUser);
        
        const enrollment = await ca.enroll({
            enrollmentID: args[0],
            enrollmentSecret: secret
        });
        
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'org2-rm',
            type: 'X.509',
        };
        
        await wallet.put(args[0], x509Identity);
        console.log('Successfully registered and enrolled admin user '+ args[0]+' and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "appUser": ${error}`);
        process.exit(1);
    }
}

main();