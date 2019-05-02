"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const child_process_1 = require("child_process");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "bira" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.hallo', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.workspace.saveAll();
        // vscode.window.onDidChangeActiveTerminal((e)=>{
        // 	console.log("Changed Terminal--->", e);
        // })
        let terminal = vscode.window.createTerminal('coderunner');
        terminal.show();
        let name = terminal.name;
        terminal.processId.then((val) => {
            console.log(`Terminal opened with ${val} id`);
            child_process_1.exec('pwd', (err, stdout, stderr) => {
                if (err) {
                    console.log("Error Occured");
                    console.log(err);
                }
                else {
                    console.log(stdout);
                }
            });
        });
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