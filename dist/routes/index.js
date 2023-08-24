"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hello_action_1 = __importDefault(require("./templates/hello-action"));
const button_action_1 = __importDefault(require("./templates/button-action"));
const popup_action_1 = __importDefault(require("./templates/popup-action"));
const connect_wallet_1 = __importDefault(require("./connect-wallet"));
const redirect_1 = __importDefault(require("./helpers/redirect"));
const view_emojis_1 = __importDefault(require("./view-emojis"));
const logout_1 = __importDefault(require("./logout"));
const send_emoji_1 = __importDefault(require("./send-emoji"));
const help_1 = __importDefault(require("./help"));
exports.default = { helloAction: hello_action_1.default, buttonAction: button_action_1.default, popupAction: popup_action_1.default, connectWallet: connect_wallet_1.default, redirect: redirect_1.default, viewEmojis: view_emojis_1.default, sendEmoji: send_emoji_1.default, logout: logout_1.default, help: help_1.default };
