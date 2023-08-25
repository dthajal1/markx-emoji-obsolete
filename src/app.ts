import createError from "http-errors";
import express, { ErrorRequestHandler } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
// import { ethers } from "ethers";
import AWS from 'aws-sdk';
import routers from "./routes";
import dbConnect from "./utils/dbConnect";
// import ProductNFT from "./contracts/ProductNFT.json";
import dotenv from "dotenv";
dotenv.config();

const app = express();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION
});

dbConnect()
  .then(() => console.log("database connected successfully!"))
  .catch((err) => console.log("err: ", err))




// const web3Provider = new ethers.providers.JsonRpcProvider(`${process.env.NEXT_PUBLIC_POLYGON_TESTNET_RPC_URL}${process.env.NEXT_PUBLIC_INFURA_API_KEY}`);
// const contractAddress = '0x25a10569E623e8553DE870978439692EB3a8e211'; // NFT contract address: token 2
// const contract = new ethers.Contract(contractAddress || "", ProductNFT.abi, web3Provider);

// contract.on('Transfer', (from, to, tokenId, event) => {
//   console.log(`NFT Transfer: From ${from} to ${to}, Token ID: ${tokenId}`);
//   // You can perform further actions here, such as saving the transfer to a database or notifying users.
// });







// const web3ProviderUrl = `${process.env.NEXT_PUBLIC_POLYGON_TESTNET_RPC_URL}${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;
// const provider = new ethers.providers.WebSocketProvider(web3ProviderUrl);

// const contractAddress = '0x25a10569E623e8553DE870978439692EB3a8e211'; // NFT contract address: token 2
// const options721 = {
//   address: contractAddress, // ERC-721 contract address
//   topics: [ethers.utils.id('Transfer(address,address,uint256)')],
// };

// const subscription721 = provider.on(options721, (log) => {
//   // Process ERC-721 transfer event
//   const from = ethers.utils.getAddress('0x' + log.topics[1].substr(26));
//   const to = ethers.utils.getAddress('0x' + log.topics[2].substr(26));
//   const tokenId = ethers.BigNumber.from(log.topics[3]);

//   console.log(`ERC-721 Transfer Event: From ${from} to ${to}, Token ID: ${tokenId}`);
// });

// subscription721.on('connected', (subscriptionId) => {
//   console.log(`Subscription for ERC-721 events started with ID: ${subscriptionId}`);
// });

// subscription721.on('error', (err) => {
//   console.error('Subscription error (ERC-721):', err);
// });













// const provider = new ethers.providers.WebSocketProvider(`${process.env.NEXT_PUBLIC_POLYGON_TESTNET_RPC_URL}${process.env.NEXT_PUBLIC_INFURA_API_KEY}`);

// const iface = new ethers.utils.Interface([
//     { type: 'address', name: 'from' },
//     { type: 'address', name: 'to' },
//     { type: 'uint256', name: 'tokenId' }
// ]);

// // Event filter for Transfer events
// const filter = {
//     address: contractAddress,
//     topics: [ethers.utils.id('Transfer(address,address,uint256)')]
// };

// // Subscribe to events using the event filter
// provider.on(filter, (log, event) => {
//     console.log("log: ", log)
//     console.log("$$$$$$$$$$$$$$$$$$$$")
//     console.log("event: ", event)

//     const decoded = iface.parseLog(log);
//     const from = decoded.args.from;
//     const to = decoded.args.to;
//     const tokenId = decoded.args.tokenId.toNumber();

//     // Check for specific conditions
//     if (from === '0x495f947276749ce646f68ac8c248420045cb7b5e') {
//         console.log('Specified address sent an NFT!');
//     }
//     if (to === '0x495f947276749ce646f68ac8c248420045cb7b5e') {
//         console.log('Specified address received an NFT!');
//     }
//     if (event.address === '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' && tokenId === 2500) {
//         console.log('Specified NFT was transferred!');
//     }

//     // Display event details
//     console.log(
//         `\n` +
//         `New ERC-721 transaction found in block ${event.blockNumber} with hash ${event.transactionHash}\n` +
//         `From: ${(from === '0x0000000000000000000000000000000000000000') ? 'New mint!' : from}\n` +
//         `To: ${to}\n` +
//         `Token contract: ${event.address}\n` +
//         `Token ID: ${tokenId}`
//     );
// });

// // Connection and error handling
// provider.once('connect', () => {
//     console.log('Connected to provider.');
// });

// provider.on('error', error => {
//     console.error('Error:', error);
// });



// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Serve static files from the 'images' directory
app.use('/imgs', express.static(path.join(__dirname, 'imgs')));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get('/home', (req, res) => {
  res.send("Welcome home!");
} )
app.use("/markx", routers.markxAction);
// app.use("/view-emojis", routers.viewEmojis);
// app.use("/post-emoji", routers.postEmoji);
// app.use("/connect-wallet", routers.connectWallet);
// app.use("/help", routers.help)
// app.use("/logout", routers.logout)
// app.use("/hello-action", routers.helloAction);
// app.use("/button-action", routers.buttonAction);
// app.use("/popup-action", routers.popupAction);
app.use("/", routers.redirect);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
const errorHandler: ErrorRequestHandler = function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
};

app.use(errorHandler);

export default app;
