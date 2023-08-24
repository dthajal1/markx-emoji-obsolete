"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureVerifier = void 0;
const ethers_1 = require("ethers");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const constants_1 = require("../constants");
const common_1 = require("@collabland/common");
const debug = (0, common_1.debugFactory)("SignatureVerifier");
class SignatureVerifier {
    verify(req, res) {
        var _a;
        if (!process.env.SKIP_VERIFICATION) {
            const ecdsaSignature = req.header(constants_1.ActionEcdsaSignatureHeader);
            const ed25519Signature = req.header(constants_1.ActionEd25519SignatureHeader);
            const signatureTimestamp = parseInt((_a = req.header(constants_1.ActionSignatureTimestampHeader)) !== null && _a !== void 0 ? _a : "0");
            const body = JSON.stringify(req.body);
            const publicKey = this.getPublicKey();
            const signature = ecdsaSignature !== null && ecdsaSignature !== void 0 ? ecdsaSignature : ed25519Signature;
            if (!signature) {
                res.status(401);
                res.send({
                    message: `${constants_1.ActionEcdsaSignatureHeader} or ${constants_1.ActionEd25519SignatureHeader} header is required`,
                });
                return;
            }
            if (!publicKey) {
                res.status(401);
                res.send({
                    message: `Public key is not set.`,
                });
                return;
            }
            const signatureType = signature === ecdsaSignature ? "ecdsa" : "ed25519";
            this.verifyRequest(body, signatureTimestamp, signature, publicKey, signatureType);
        }
    }
    generateEd25519KeyPair() {
        const keyPair = tweetnacl_1.default.sign.keyPair();
        return {
            publicKey: Buffer.from(keyPair.publicKey).toString("hex"),
            privateKey: Buffer.from(keyPair.secretKey).toString("hex"),
        };
    }
    generateEcdsaKeyPair() {
        const wallet = ethers_1.Wallet.createRandom();
        return {
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
        };
    }
    getPublicKey() {
        return process.env.COLLABLAND_ACTION_PUBLIC_KEY;
    }
    verifyRequest(body, signatureTimestamp, signature, publicKey, signatureType = "ecdsa") {
        const delta = Math.abs(Date.now() - signatureTimestamp);
        if (delta >= 5 * 60 * 1000) {
            throw new Error("Invalid request - signature timestamp is expired.");
        }
        const msg = signatureTimestamp + body;
        if (signatureType === "ed25519") {
            this.verifyRequestWithEd25519(publicKey, signature, msg);
        }
        else if (signatureType === "ecdsa") {
            this.verifyRequestWithEcdsa(publicKey, signature, msg);
        }
        return JSON.parse(body);
    }
    verifyRequestWithEd25519(publicKey, signature, body) {
        let verified = false;
        try {
            debug("Verifying webhook request with Ed25519 signature...");
            debug("Public key: %s, signature: %s, message: %s", publicKey, signature, body);
            verified =
                signature != null &&
                    tweetnacl_1.default.sign.detached.verify(Buffer.from(body, "utf-8"), Buffer.from(signature, "hex"), Buffer.from(publicKey, "hex"));
            debug("Signature verified: %s", verified);
        }
        catch (err) {
            verified = false;
            debug(err.message);
        }
        if (!verified) {
            throw new Error("Invalid request - Ed25519 signature cannot be verified.");
        }
        return verified;
    }
    verifyRequestWithEcdsa(publicKey, signature, body) {
        let verified = false;
        try {
            debug("Verifying webhook request with Ecdsa signature...");
            debug("Public key: %s, signature: %s, message: %s", publicKey, signature, body);
            const digest = ethers_1.utils.hashMessage(body);
            verified =
                signature != null &&
                    ethers_1.utils.recoverPublicKey(digest, signature) === publicKey;
            debug("Signature verified: %s", verified);
        }
        catch (err) {
            debug("Fail to verify signature: %O", err);
            verified = false;
        }
        if (!verified) {
            debug("Invalid signature: %s, body: %s", signature, body);
            throw new Error("Invalid request - Ecdsa signature cannot be verified.");
        }
        return verified;
    }
}
exports.SignatureVerifier = SignatureVerifier;
