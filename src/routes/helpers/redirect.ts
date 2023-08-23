
import express from "express";
import { ethers } from "ethers";
import {
  APIInteraction,
  MessageFlags,
} from "discord-api-types/v10";
import { FollowUp } from "../../helpers";
import {
  DiscordActionRequest,
  RESTPostAPIWebhookWithTokenJSONBody,
} from "@collabland/discord";
import axios from "axios";
import AWS from "aws-sdk"
import { createCanvas, loadImage } from "canvas";
import { retrieveData, removeData } from "../../helpers/cache-manager";
import User from "../../models/User";
import { fetchProductData, fetchProducts } from "../../api/products";

const router = express.Router();

const s3 = new AWS.S3();

export interface Product {
  name: string
  description: string
  mergedImgUrl: string
  images: string[]
}

router.get("/oauth2/discord/redirect", async (req, res) => {
    const authorizationCode = req.query.code as string;
    const stateString = req.query.state as string;
  
    const storedInteraction = retrieveData<APIInteraction>(stateString);
  
    if (authorizationCode && storedInteraction) {
      try {
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post(
          "https://api.collab.land/oauth2/token",
          {
            grant_type: "authorization_code",
            code: authorizationCode,
            client_id: process.env.COLLABLAND_CLIENT_ID,
            client_secret: process.env.COLLABLAND_CLIENT_SECRET,
            redirect_uri: process.env.COLLABLAND_REDIRECT_URI,
          },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            }
          }
        );
  
        const accessToken = tokenResponse.data.access_token;

        let user = await User.findOne({ discordId: storedInteraction?.member?.user?.id });
        if (user) {
          user.accessToken = accessToken;
        } else {
          user = new User({
            discordId: storedInteraction?.member?.user?.id,
            accessToken,
          });
        }

        /* prefetch data from blockchain and store it on db */
        // retrieve our NFTs and create token gating rule using its address
        const web3Provider = new ethers.providers.JsonRpcProvider(`${process.env.NEXT_PUBLIC_POLYGON_TESTNET_RPC_URL}${process.env.NEXT_PUBLIC_INFURA_API_KEY}`);
        const productNFTs = await fetchProducts(web3Provider);
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
        const response = await axios.get("https://api.collab.land/account/wallets", {
            headers: {
            Authorization: `Bearer ${accessToken}`,
            },
        });
        const userWallets = response.data.items;

        // verify user holds our NFTs and prepare for display
        const gatewayUrl = "https://ipfs.io/ipfs/";
        const productsToDisplay: Product[] = []
        if (userWallets.length > 0) {
          const response = await axios.post(
            'https://api.collab.land/access-control/check-roles',
            {
              account: userWallets[0].address,
              rules,
            },
            {
              headers: {
                Accept: 'application/json',
                'X-API-KEY': process.env.COLLABLAND_API_KEY,
                'Content-Type': 'application/json',
              },
            }
          )

          const result = response.data.roles;
          for (let i = 0; i < result.length; i++) {
            if (result[i].granted) {
              const product: Product = {
                name: productNFTs[i].metadata.name,                
                description: productNFTs[i].metadata.description,
                mergedImgUrl: "",
                images: []
              }
              const productData = await fetchProductData(web3Provider, productNFTs[i].contractAddress); // is productNFTs[result[i].id.toInt()].contractAddress the same?
              const { uniqueImages, data } = productData;
              for (let j = 0; j < uniqueImages; j++) {
                product.images.push(data[j].image.replace("ipfs://", gatewayUrl));
              }

              // merge 12 images into single image
              const canvasWidth = 800; // Adjust canvas dimensions as needed
              const canvasHeight = 800;
              const canvas = createCanvas(canvasWidth, canvasHeight);
              const ctx = canvas.getContext('2d');

              // Load and draw images on the canvas
              const images = await Promise.all(product.images.map(async (img) => {
                const image = await loadImage(img); // Load the image using loadImage
                return image;
              }));

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
                Bucket: process.env.S3_BUCKET || "markx-bucket", // TODO: change this
                Key: `${product.name}-merged-image.jpg`, // Change the key as needed
                Body: buffer,
                // ACL: "public-read", // Set ACL for public access if needed
                ContentType: "image/jpeg", // Adjust content type as needed
              };
              const uploadResult = await s3.upload(uploadParams).promise();
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

        await user.save();

        const followUpMsg = `You now have access to your emoji NFTs collection, run the /view-emojis command to see it in action!`
        await followup(storedInteraction, followUpMsg)
  
        removeData(stateString);
        res.send('Authorization successful, you can safely close this window.');
  
      } catch (err) {
        console.error("Failed to exchange authorization code for access token:", err);
        res.send('Authorization failed. Please try again.');
      }
    } else {
      res.send('Authorization failed. Please try again.');
    }
})

  
// Helper function
async function followup(
    request: DiscordActionRequest<APIInteraction>,
    message: string,
) {
    const follow = new FollowUp();
    const callback = request.actionContext?.callbackUrl;
    if (callback != null) {
        const followupMsg: RESTPostAPIWebhookWithTokenJSONBody = {
        content: message,
        flags: MessageFlags.Ephemeral,
    };
  
    await follow.followupMessage(request, followupMsg);
    }
}


export default router;
  