// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Axios from 'axios';
import * as cheerio from 'cheerio';
import { exec, ExecException } from 'child_process';
import {readdir, fstat,  writeFile} from 'fs';

var scrapePage = async (ansObj: { link: any; is_answered?: any; score?: any; title: any; }) => {
	let $ = cheerio.load(ansObj.link);
	console.log($('.answercell').find('.post-text').text());
};

var asyncAnswer = async (obj: Object | any) => {
	let {link, is_answered, score, title} = obj;
	let ansObj = {
		link,
		is_answered,
		score,
		title
	};
	scrapePage(ansObj);
};


var callStackoverflow = async (searchTerm: string) => {
	let url = `https://api.stackexchange.com/2.2/search?order=desc&sort=votes&intitle=${searchTerm}&site=stackoverflow`;
	vscode.window.showInformationMessage("Fetching Stackoverflow results");
	Axios.get(url).then( async (resp)=>{
		let {data, status} = resp;
		if (status===200){
			console.log("Searching for -->", searchTerm);
			let dataArray = data['items'].slice(0,5);
			let qa = dataArray.map((item: any) => asyncAnswer(item));


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

var parseError = (error: ExecException): String | null => {
	let errorList = error.message.split("\n");
	errorList.forEach(searchTerm => {
		if(searchTerm.includes("Error")){
			callStackoverflow(searchTerm);
		}
	});
	return null;
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
						console.log("Error");
						writeFile('./output.txt', err, ()=>{
							parseError(err);
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
