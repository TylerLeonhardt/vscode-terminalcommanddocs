// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as which from 'which';

const verbNounRegex = /(Add|Approve|Assert|Backup|Block|Build|Checkpoint|Clear|Close|Compare|Complete|Compress|Confirm|Connect|Convert|ConvertFrom|ConvertTo|Copy|Debug|Deny|Deploy|Disable|Disconnect|Dismount|Edit|Enable|Enter|Exit|Expand|Export|Find|Format|Get|Grant|Group|Hide|Import|Initialize|Install|Invoke|Join|Limit|Lock|Measure|Merge|Mount|Move|New|Open|Optimize|Out|Ping|Pop|Protect|Publish|Push|Read|Receive|Redo|Register|Remove|Rename|Repair|Request|Reset|Resize|Resolve|Restart|Restore|Resume|Revoke|Save|Search|Select|Send|Set|Show|Skip|Split|Start|Step|Stop|Submit|Suspend|Switch|Sync|Test|Trace|Unblock|Undo|Uninstall|Unlock|Unprotect|Unpublish|Unregister|Update|Use|Wait|Watch|Write)-[a-zA-Z0-9]*/i;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.window.registerTerminalLinkProvider({
			provideTerminalLinks: (context: vscode.TerminalLinkContext, token: vscode.CancellationToken) => {
				// Detect if the line has a verb-noun
				const execResult = verbNounRegex.exec(context.line);
				if (!execResult) {
					return [];
				}
				return [
					{
						startIndex: execResult.index,
						length: execResult[0].length,
						tooltip: `Get online help for: '${execResult[0]}'`,
						data: execResult[0]
					}
				];
			},
			handleTerminalLink: async (link: any) => {
				let pwshExePath: string | undefined;
				try {
					pwshExePath = await which('pwsh');
				} catch(e) {
					try {
						pwshExePath = await which('powershell');
					} catch(e) {
						vscode.window.showErrorMessage("Couldn't find PowerShell. Make sure it's installed.");
						return;
					}
				}

				vscode.tasks.executeTask(createTask(pwshExePath, link.data));
			}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}

function createTask(
	pwshExePath: string,
	command: string): vscode.Task {

	const shellExec = new vscode.ShellExecution(`Get-Help -Online ${command}`,
	{
		executable: pwshExePath,
		shellArgs: [ '-NoLogo','-NoProfile', '-NonInteractive','-Command' ]
	});

	const task = new vscode.Task(
		{ type: 'get-help' },
		vscode.TaskScope.Workspace,
		'Get help online',
		'Test HyperLink',
		shellExec);

	task.presentationOptions.focus = false;
	task.presentationOptions.reveal = vscode.TaskRevealKind.Silent;
	return task;
}
