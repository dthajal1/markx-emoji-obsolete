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
exports.fetchProductData = exports.fetchMetadata = exports.fetchProducts = void 0;
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
const ProductNFTContract_json_1 = __importDefault(require("../contracts/ProductNFTContract.json"));
const ProductNFT_json_1 = __importDefault(require("../contracts/ProductNFT.json"));
const fetchProducts = (web3Provider) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productFactory = new ethers_1.ethers.Contract(process.env.NEXT_PUBLIC_PRODUCT_NFT_CONTRACT_ADDRESS || "", ProductNFTContract_json_1.default.abi, web3Provider);
        const products = [];
        const productCount = yield productFactory.getProductNFTsCount();
        const fetchMetadataPromises = [];
        for (let i = 0; i < Math.min(productCount.toNumber()); i++) {
            const contractAddress = yield productFactory.productNFTs(i);
            fetchMetadataPromises.push((0, exports.fetchMetadata)(web3Provider, contractAddress));
            products.push({
                id: i,
                contractAddress,
                metadata: {
                    name: "",
                    description: "",
                    image: ""
                }
            });
        }
        const metadataResults = yield Promise.all(fetchMetadataPromises);
        metadataResults.forEach((metadata, i) => {
            products[i].metadata = metadata;
        });
        return products;
    }
    catch (err) {
        console.log(`Failed to fetch products: ${err}`);
        return [];
    }
});
exports.fetchProducts = fetchProducts;
const fetchMetadata = (web3Provider, contractAddress) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contract = new ethers_1.ethers.Contract(contractAddress || "", ProductNFT_json_1.default.abi, web3Provider);
        const baseUri = yield contract.baseUri();
        const ipfsEndpoint = baseUri.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/');
        const metadataUrl = ipfsEndpoint + '1.json';
        const metadataRes = yield axios_1.default.get(metadataUrl);
        const metadata = metadataRes.data;
        const { name, description, image } = metadata;
        return {
            name,
            description,
            image,
        };
    }
    catch (err) {
        console.log(`Failed to fetch metadata: ${err}`);
        return {
            name: "",
            description: "",
            image: "",
        };
    }
});
exports.fetchMetadata = fetchMetadata;
const fetchProductData = (web3Provider, contractAddress) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contract = new ethers_1.ethers.Contract(contractAddress || "", ProductNFT_json_1.default.abi, web3Provider);
        const baseUri = yield contract.baseUri();
        const uniqueImagesBig = yield contract.uniqueImages();
        const uniqueImages = uniqueImagesBig.toString();
        const ipfsEndpoint = baseUri.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/');
        const fetchMetadataPromises = [];
        for (let i = 1; i <= uniqueImagesBig; i++) {
            const metadataUrl = ipfsEndpoint + i + '.json';
            fetchMetadataPromises.push(axios_1.default.get(metadataUrl));
        }
        const metadataResults = yield Promise.all(fetchMetadataPromises);
        const data = metadataResults.map((metadataRes) => metadataRes.data);
        return {
            data,
            uniqueImages
        };
    }
    catch (err) {
        console.log(`Failed to fetch product data: ${err}`);
        return {
            data: [],
            uniqueImages: ""
        };
    }
});
exports.fetchProductData = fetchProductData;
