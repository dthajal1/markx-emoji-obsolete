"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ethers_1 = require("ethers");
const v10_1 = require("discord-api-types/v10");
const helpers_1 = require("../../helpers");
const axios_1 = __importDefault(require("axios"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const canvas_1 = require("canvas");
const cache_manager_1 = require("../../helpers/cache-manager");
const User_1 = __importDefault(require("../../models/User"));
const products_1 = require("../../api/products");
const router = express_1.default.Router();
const s3 = new aws_sdk_1.default.S3();
router.get("/oauth2/discord/redirect", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const authorizationCode = req.query.code;
    const stateString = req.query.state;
    const storedInteraction = (0, cache_manager_1.retrieveData)(stateString);
    if (authorizationCode && storedInteraction) {
        try {
            // Exchange the authorization code for an access token
            const tokenResponse = yield axios_1.default.post("https://api.collab.land/oauth2/token", {
                grant_type: "authorization_code",
                code: authorizationCode,
                client_id: process.env.COLLABLAND_CLIENT_ID,
                client_secret: process.env.COLLABLAND_CLIENT_SECRET,
                redirect_uri: process.env.COLLABLAND_REDIRECT_URI,
            }, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            });
            const accessToken = tokenResponse.data.access_token;
            let user = yield User_1.default.findOne({ discordId: (_b = (_a = storedInteraction === null || storedInteraction === void 0 ? void 0 : storedInteraction.member) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id });
            if (user) {
                user.accessToken = accessToken;
            }
            else {
                user = new User_1.default({
                    discordId: (_d = (_c = storedInteraction === null || storedInteraction === void 0 ? void 0 : storedInteraction.member) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.id,
                    accessToken,
                });
            }
            /* prefetch data from blockchain and store it on db */
            // retrieve our NFTs and create token gating rule using its address
            const web3Provider = new ethers_1.ethers.providers.JsonRpcProvider(`${process.env.NEXT_PUBLIC_POLYGON_TESTNET_RPC_URL}${process.env.NEXT_PUBLIC_INFURA_API_KEY}`);
            const productNFTs = yield (0, products_1.fetchProducts)(web3Provider);
            // console.log("contrraact addresses")
            // productNFTs.map((productMetaData, i) => {
            //   console.log(productMetaData.contractAddress)
            // });
            // console.log("contrraact addresses done printing")
            const rules = productNFTs.map((productMetaData, i) => ({
                type: 'ERC721',
                chainId: 80001,
                minToken: '1',
                contractAddress: productMetaData.contractAddress,
                roleId: i.toString(),
            }));
            // ex rules = [memberNFT, primeNFT]
            // console.log("retrieved our NFTs");
            // TODO: modify to work for multiple wallets
            // retrieve user's wallet address
            const response = yield axios_1.default.get("https://api.collab.land/account/wallets", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const userWallets = response.data.items;
            // verify user holds our NFTs and prepare for display
            const gatewayUrl = "https://ipfs.io/ipfs/";
            const productsToDisplay = [];
            if (userWallets.length > 0) {
                const response = yield axios_1.default.post('https://api.collab.land/access-control/check-roles', {
                    account: userWallets[0].address,
                    rules,
                }, {
                    headers: {
                        Accept: 'application/json',
                        'X-API-KEY': process.env.COLLABLAND_API_KEY,
                        'Content-Type': 'application/json',
                    },
                });
                const result = response.data.roles;
                for (let i = 0; i < result.length; i++) {
                    if (result[i].granted) {
                        const product = {
                            name: productNFTs[i].metadata.name,
                            description: productNFTs[i].metadata.description,
                            mergedImgUrl: "",
                            images: []
                        };
                        const productData = yield (0, products_1.fetchProductData)(web3Provider, productNFTs[i].contractAddress); // is productNFTs[result[i].id.toInt()].contractAddress the same?
                        const { uniqueImages, data } = productData;
                        for (let j = 0; j < uniqueImages; j++) {
                            product.images.push(data[j].image.replace("ipfs://", gatewayUrl));
                        }
                        // merge 12 images into single image
                        const canvasWidth = 800; // Adjust canvas dimensions as needed
                        const canvasHeight = 800;
                        const canvas = (0, canvas_1.createCanvas)(canvasWidth, canvasHeight);
                        const ctx = canvas.getContext('2d');
                        // Load and draw images on the canvas
                        const images = yield Promise.all(product.images.map((img) => __awaiter(void 0, void 0, void 0, function* () {
                            const image = yield (0, canvas_1.loadImage)(img); // Load the image using loadImage
                            return image;
                        })));
                        // Define grid dimensions
                        const maxCols = 4; // Maximum number of columns
                        const cellWidth = canvasWidth / maxCols;
                        const cellHeight = cellWidth; // To keep images square
                        // Calculate the number of rows and columns
                        const numImages = images.length;
                        const cols = Math.min(numImages, maxCols);
                        const rows = Math.ceil(numImages / cols);
                        // Calculate the total height occupied by images in the grid
                        const gridHeight = rows * cellHeight;
                        // Calculate padding to center the grid vertically
                        const paddingTop = (canvasHeight - gridHeight) / 2;
                        // Calculate horizontal padding
                        const paddingX = (canvasWidth - cols * cellWidth) / 2;
                        // Draw images on the canvas in a grid with centered vertical and horizontal alignment
                        images.forEach((image, index) => {
                            const col = index % cols;
                            const row = Math.floor(index / cols);
                            const x = paddingX + col * cellWidth;
                            const y = paddingTop + row * cellHeight;
                            ctx.drawImage(image, x, y, cellWidth, cellHeight);
                        });
                        // Convert canvas to a buffer
                        const buffer = canvas.toBuffer();
                        // Upload the merged image data to S3
                        const uploadParams = {
                            Bucket: process.env.S3_BUCKET || "markx-bucket",
                            Key: `${product.name}-merged-image.jpg`,
                            Body: buffer,
                            // ACL: "public-read", // Set ACL for public access if needed
                            ContentType: "image/jpeg", // Adjust content type as needed
                        };
                        const uploadResult = yield s3.upload(uploadParams).promise();
                        // console.log("Upload to s3 successful");
                        // Create the S3 URL for the merged image
                        const s3ImageUrl = uploadResult.Location;
                        product.mergedImgUrl = s3ImageUrl;
                        productsToDisplay.push(product);
                    }
                }
            }
            // console.log("verified NFTs");
            user.products = productsToDisplay;
            // console.log("saved products: ", user.products)
            yield user.save();
            const followUpMsg = `You now have access to your emoji NFTs collection, run the /view-emojis command to see it in action!`;
            yield followup(storedInteraction, followUpMsg);
            (0, cache_manager_1.removeData)(stateString);
            res.send('Authorization successful, you can safely close this window.');
        }
        catch (err) {
            console.error("Failed to exchange authorization code for access token:", err);
            res.send('Authorization failed. Please try again.');
        }
    }
    else {
        res.send('Authorization failed. Please try again.');
    }
}));
// Helper function
function followup(request, message) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const follow = new helpers_1.FollowUp();
        const callback = (_a = request.actionContext) === null || _a === void 0 ? void 0 : _a.callbackUrl;
        if (callback != null) {
            const followupMsg = {
                content: message,
                flags: v10_1.MessageFlags.Ephemeral,
            };
            yield follow.followupMessage(request, followupMsg);
        }
    });
}
exports.default = router;
