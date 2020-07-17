import * as vscode from 'vscode';
let statusBarItem: vscode.StatusBarItem;

const COMMAND_ID_SETUP = 'nite-lite.setup';
const COMMAND_ID_TOGGLE = 'nite-lite.toggle';

interface IThemeConfiguration {
    primary: string;
    secondary: string;
}

enum ThemeColor {
    Dark = 'vs-dark',
    Light = 'vs',
    HighContrast = 'hc',
}

interface ITheme {
    id?: string;
    label: string;
    uiTheme: ThemeColor;
    path: 'string';
}

let themes: ITheme[];
let configuration: IThemeConfiguration;

export function activate(context: vscode.ExtensionContext) {
    themes = getAvailableThemes();
    configuration = getConfiguration();

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBarItem.command = COMMAND_ID_TOGGLE;
    statusBarItem.text = `$(color-mode)`;
    statusBarItem.accessibilityInformation = {
        label: 'Toggle theme',
    };
    statusBarItem.tooltip = 'Toggle theme';
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_ID_SETUP, async () => {
            themes = getAvailableThemes();

            const themeList = themes.sort((a, b) => a.label.localeCompare(b.label));

            const primaryTheme = await vscode.window.showQuickPick(themeList, {
                placeHolder: 'Select your primary theme',
            });

            if (primaryTheme) {
                vscode.workspace
                    .getConfiguration()
                    .update('nite-lite.primaryTheme', primaryTheme?.id || primaryTheme.label, true)
                    .then(
                        () => {
                            vscode.window.showInformationMessage('Set primary theme');
                        },
                        () => {
                            vscode.window.showErrorMessage('Could not set primary theme');
                        }
                    );
            }

            const secondaryTheme = await vscode.window.showQuickPick(themeList, {
                placeHolder: 'Select your secondary theme',
            });

            if (secondaryTheme) {
                vscode.workspace
                    .getConfiguration()
                    .update('nite-lite.secondaryTheme', secondaryTheme?.id || secondaryTheme.label, true)
                    .then(
                        () => {
                            vscode.window.showInformationMessage('Set secondary theme');
                        },
                        () => {
                            vscode.window.showErrorMessage('Could not set secondary theme');
                        }
                    );
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_ID_TOGGLE, () => {
            const activeTheme = vscode.workspace.getConfiguration().get<string>('workbench.colorTheme');

            let newTheme = configuration.primary;

            if (activeTheme === configuration.primary) {
                newTheme = configuration.secondary;
            }

            if (!themes.find((theme) => (theme?.id || theme.label) === newTheme)) {
                vscode.window.showErrorMessage(`Could not change theme. ${newTheme} is not found.`);
                return;
            }

            vscode.workspace.getConfiguration().update('workbench.colorTheme', newTheme, true);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration('nite-lite.primaryTheme') ||
                e.affectsConfiguration('nite-lite.secondaryTheme')
            ) {
                configuration = getConfiguration();
            }
        })
    );

    statusBarItem.show();
}

const getAvailableThemes = (): ITheme[] => {
    const installedThemes = vscode.extensions.all
        .filter((theme) => theme.packageJSON.contributes && theme.packageJSON.contributes.themes)
        .map((theme) => theme.packageJSON.contributes.themes)
        .flat();

    return installedThemes;
};

const getConfiguration = (): IThemeConfiguration => {
    const preferredDarkTheme = vscode.workspace.getConfiguration().get<string>('workbench.preferredDarkColorTheme');
    const preferredLightTheme = vscode.workspace.getConfiguration().get<string>('workbench.preferredLightColorTheme');
    const primaryTheme = vscode.workspace.getConfiguration().get<string>('nite-lite.primaryTheme');
    const secondaryTheme = vscode.workspace.getConfiguration().get<string>('nite-lite.secondaryTheme');

    return {
        primary: primaryTheme || preferredDarkTheme!,
        secondary: secondaryTheme || preferredLightTheme!,
    };
};

export function deactivate() {}
