// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Axios from 'axios';
import * as cheerio from 'cheerio';
import { exec, ExecException } from 'child_process';
import {readdir, fstat,  writeFile} from 'fs';
import * as puppeteer from 'puppeteer';
import * as util from 'util';

var scrapePage = async (ansObj: { link: any; is_answered?: any; score?: any; title: any; }) => {
	return new Promise( async (resolve, reject) => {
		console.log(ansObj.link);
		let response = await Axios.get(ansObj.link);
		if(response.status===200){
			let $ = cheerio.load(response.data);
			let answer = await $('.answercell').children('.post-text');
			answer = answer.map((idx, ele) => {
				return $(ele).text();
			}); 
			return resolve(util.inspect({...ansObj,answer}));
		}
	});
};

async function getPage(ansObj: { link: any; is_answered?: any; score?: any; title: any; }){
	const browser = await puppeteer.launch({headless: false});
	const page = await browser.newPage();
	await page.goto(ansObj.link);
	await page.setViewport({width: 1000, height: 500});
	await page.screenshot({path: `results/${ansObj.title}.png`});
	// await page.pdf({path: `./pdfs/${ansObj.title}.pdf`});

	await browser.close();
	// return page;
}

var asyncAnswer = async (obj: Object | any) => {
	let {link, is_answered, score, title} = obj;
	let ansObj = {
		link,
		is_answered,
		score,
		title
	};

	await getPage(ansObj);

	// let pages = await scrapePage(ansObj);
	// console.log("Pages--->", pages);
	// writeFile('./test.json', JSON.stringify(pages), () => {
	// 	console.log("DONE");
	// });
	// return pages;
};


var callStackoverflow = async (searchTerm: string) => {
	let url = `https://api.stackexchange.com/2.2/search?order=desc&sort=votes&intitle=${searchTerm}&site=stackoverflow`;
	vscode.window.showInformationMessage("Fetching Stackoverflow results");
	await Axios.get(url).then( async (resp)=>{
		let {data, status} = resp;
		if (status===200){
			console.log("Searching for -->", searchTerm);
			let dataArray = data['items'].slice(0,5);
			return await Promise.all(dataArray.map((item: any) => asyncAnswer(item)));
			// writeFile('./response.json', JSON.stringify(resp.data),{flag: 'w'}, (err)=>{
			// 	if(err) {
			// 		return err;
			// 	}
				// vscode.window.showTextDocument().then(val=> console.log(val));
			// });
			// console.log(vscode.workspace.asRelativePath());
			// console.log(vscode.workspace.textDocuments);
		} else{
			vscode.window.showErrorMessage("Failed to fetch Stackoverflow");
		}
	}).catch((err)=>{
		console.log(err);
	});
};

var parseError = async (error: ExecException): Promise<any> => {
	let errorList = error.message.split("\n");
	errorList.forEach( async (searchTerm) => {
		if(searchTerm.includes("Error")){
			let ans = await callStackoverflow(searchTerm);
			console.log("Results-->", ans);
		}
	});
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
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
	let disposable: vscode.Disposable = vscode.commands.registerCommand('extension.hallo', () => {
		// The code you place here will be executed every time your command is executed
		vscode.workspace.saveAll();
		// vscode.window.onDidChangeActiveTerminal((e)=>{
		// 	console.log("Changed Terminal--->", e);
		// })
		let terminal = vscode.window.createTerminal('coderunner');
		terminal.show();
		let name = terminal.name;
		let codefiles = [];
		let file: string;
		let filepath = vscode.window.activeTextEditor || null;
		if(filepath){
			file = filepath.document.uri.fsPath;
		}
		// console.log("File is--->", file);
		terminal.processId.then((val: Number)=>{
			console.log(`Terminal opened with ${val} id`);
			if(file.endsWith('.py')){
				codefiles.push(file);
				exec(`python ${file}`, (err, stdout, stderr)=>{
					if(err){
						writeFile('./output.txt', err, async ()=>{
							let answers = await parseError(err);
						});
					} else{
						console.log(stdout, stderr);
						writeFile('./output.txt', stdout, (output)=>{
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

	context.subscriptions.push(vscode.commands.registerCommand('extension.sendText',()=>{
		vscode.window.showInputBox({placeHolder: "Enter your language: "}).then(value => {
			console.log(value);
		});
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
