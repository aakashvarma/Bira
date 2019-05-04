"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const axios_1 = require("axios");
const cheerio = require("cheerio");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const puppeteer = require("puppeteer");
const util = require("util");
var scrapePage = (ansObj) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        console.log(ansObj.link);
        let response = yield axios_1.default.get(ansObj.link);
        if (response.status === 200) {
            let $ = cheerio.load(response.data);
            let answer = yield $('.answercell').children('.post-text');
            answer = answer.map((idx, ele) => {
                return $(ele).text();
            });
            return resolve(util.inspect(Object.assign({}, ansObj, { answer })));
        }
    }));
});
function getPage(ansObj) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer.launch({ headless: false });
        const page = yield browser.newPage();
        yield page.goto(ansObj.link);
        yield page.setViewport({ width: 1000, height: 500 });
        yield page.screenshot({ path: `results/${ansObj.title}.png` });
        // await page.pdf({path: `./pdfs/${ansObj.title}.pdf`});
        yield browser.close();
        // return page;
    });
}
var asyncAnswer = (obj) => __awaiter(this, void 0, void 0, function* () {
    let { link, is_answered, score, title } = obj;
    let ansObj = {
        link,
        is_answered,
        score,
        title
    };
    yield getPage(ansObj);
    // let pages = await scrapePage(ansObj);
    // console.log("Pages--->", pages);
    // writeFile('./test.json', JSON.stringify(pages), () => {
    // 	console.log("DONE");
    // });
    // return pages;
});
var callStackoverflow = (searchTerm) => __awaiter(this, void 0, void 0, function* () {
    let url = `https://api.stackexchange.com/2.2/search?order=desc&sort=votes&intitle=${searchTerm}&site=stackoverflow`;
    vscode.window.showInformationMessage("Fetching Stackoverflow results");
    yield axios_1.default.get(url).then((resp) => __awaiter(this, void 0, void 0, function* () {
        let { data, status } = resp;
        if (status === 200) {
            console.log("Searching for -->", searchTerm);
            let dataArray = data['items'].slice(0, 5);
            return yield Promise.all(dataArray.map((item) => asyncAnswer(item)));
            // writeFile('./response.json', JSON.stringify(resp.data),{flag: 'w'}, (err)=>{
            // 	if(err) {
            // 		return err;
            // 	}
            // vscode.window.showTextDocument().then(val=> console.log(val));
            // });
            // console.log(vscode.workspace.asRelativePath());
            // console.log(vscode.workspace.textDocuments);
        }
        else {
            vscode.window.showErrorMessage("Failed to fetch Stackoverflow");
        }
    })).catch((err) => {
        console.log(err);
    });
});
var parseError = (error) => __awaiter(this, void 0, void 0, function* () {
    let errorList = error.message.split("\n");
    errorList.forEach((searchTerm) => __awaiter(this, void 0, void 0, function* () {
        if (searchTerm.includes("Error")) {
            let ans = yield callStackoverflow(searchTerm);
            console.log("Results-->", ans);
        }
    }));
});
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "bira" is now active!');
    //TODO: Check is language is available
    vscode.languages.getLanguages().then(langs => {
        console.log(langs);
    });
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.hallo', () => {
        // The code you place here will be executed every time your command is executed
        vscode.workspace.saveAll();
        // vscode.window.onDidChangeActiveTerminal((e)=>{
        // 	console.log("Changed Terminal--->", e);
        // })
        let terminal = vscode.window.createTerminal('coderunner');
        terminal.show();
        let name = terminal.name;
        let codefiles = [];
        let file;
        let filepath = vscode.window.activeTextEditor || null;
        if (filepath) {
            file = filepath.document.uri.fsPath;
        }
        // console.log("File is--->", file);
        terminal.processId.then((val) => {
            console.log(`Terminal opened with ${val} id`);
            if (file.endsWith('.py')) {
                codefiles.push(file);
                child_process_1.exec(`python ${file}`, (err, stdout, stderr) => {
                    if (err) {
                        fs_1.writeFile('./output.txt', err, () => __awaiter(this, void 0, void 0, function* () {
                            let answers = yield parseError(err);
                        }));
                    }
                    else {
                        console.log(stdout, stderr);
                        fs_1.writeFile('./output.txt', stdout, (output) => {
                            console.log(output);
                        });
                    }
                });
            }
        });
        // exec("-name '*.py'", (err, stdout, stderr)=>{
        // 	if(err){
        // 		console.log("Error Occured");
        // 		console.log(err);
        // 	} else{
        // 		console.log(stdout);
        // 	}
        // })
        // console.log(vscode.window.activeTextEditor);
        vscode.window.showInformationMessage('Processing.....');
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.commands.registerCommand('extension.sendText', () => {
        vscode.window.showInputBox({ placeHolder: "Enter your language: " }).then(value => {
            console.log(value);
        });
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map