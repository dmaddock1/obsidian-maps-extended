import { App, Modal, PluginSettingTab, Setting, SettingDefinitionItem } from 'obsidian';
import ObsidianMapsPlugin from './main';

export interface TileSet {
	id: string;
	name: string;
	lightTiles: string;
	darkTiles: string;
}

/** 'auto' follows Obsidian's light/dark theme; 'light' and 'dark' override it. */
export type MapTheme = 'auto' | 'light' | 'dark';

export interface MapSettings {
	tileSets: TileSet[];
	mapTheme: MapTheme;
}

export const DEFAULT_SETTINGS: MapSettings = {
	tileSets: [],
	mapTheme: 'auto',
};

class TileSetModal extends Modal {
	tileSet: TileSet;
	onSave: (tileSet: TileSet) => void;
	isNew: boolean;

	constructor(app: App, tileSet: TileSet | null, onSave: (tileSet: TileSet) => void) {
		super(app);
		this.isNew = !tileSet;
		this.tileSet = tileSet || {
			id: Date.now().toString(),
			name: '',
			lightTiles: '',
			darkTiles: ''
		};
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl, modalEl } = this;
		
		this.setTitle(this.isNew ? 'Add background' : 'Edit background');

		new Setting(contentEl)
			.setName('Name')
			.setDesc('A name for this background.')
			.addText(text => text
				.setPlaceholder('e.g. Terrain, satellite')
				.setValue(this.tileSet.name)
				.onChange(value => {
					this.tileSet.name = value;
				})
			);

		new Setting(contentEl)
			.setName('Light mode')
			.setDesc(createFragment(frag => {
				frag.appendText('Tile URL or style URL for light mode. See the ');
				frag.createEl('a', {
					href: 'https://help.obsidian.md/bases/views/map',
					text: 'Map view documentation'
				});
				frag.appendText(' for examples.');
			}))
			.addText(text => text
				.setPlaceholder('https://tiles.openfreemap.org/styles/bright')
				.setValue(this.tileSet.lightTiles)
				.onChange(value => {
					this.tileSet.lightTiles = value;
				})
			);

		new Setting(contentEl)
			.setName('Dark mode (optional)')
			.setDesc('Tile URL or style URL for dark mode. If not specified, light mode tiles will be used.')
			.addText(text => text
				.setPlaceholder('https://tiles.openfreemap.org/styles/dark')
				.setValue(this.tileSet.darkTiles)
				.onChange(value => {
					this.tileSet.darkTiles = value;
				})
			);

		const buttonContainerEl = modalEl.createDiv('modal-button-container');
		
		buttonContainerEl.createEl('button', { cls: 'mod-cta', text: 'Save' })
			.addEventListener('click', () => {
				this.onSave(this.tileSet);
				this.close();
			});
		
		buttonContainerEl.createEl('button', { text: 'Cancel' })
			.addEventListener('click', () => {
				this.close();
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class MapSettingTab extends PluginSettingTab {
	plugin: ObsidianMapsPlugin;

	constructor(app: App, plugin: ObsidianMapsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [{
			name: 'Map theme',
			desc: 'Use light or dark map backgrounds regardless of the Obsidian theme, or follow it.',
			control: {
				type: 'dropdown',
				key: 'mapTheme',
				defaultValue: DEFAULT_SETTINGS.mapTheme,
				options: {
					auto: 'Follow Obsidian',
					light: 'Light',
					dark: 'Dark',
				},
			},
		}, {
			type: 'list',
			heading: 'Backgrounds',
			emptyState: 'Add background sets available to all maps.',
			addItem: {
				name: 'Add background',
				action: () => {
					new TileSetModal(this.app, null, (tileSet) => {
						this.plugin.settings.tileSets.push(tileSet);
						void this.saveAndRefresh();
					}).open();
				},
			},
			onReorder: (oldIndex, newIndex) => {
				const tileSets = this.plugin.settings.tileSets;
				tileSets.splice(newIndex, 0, ...tileSets.splice(oldIndex, 1));
				void this.saveAndRefresh();
			},
			// Tile URLs can carry access tokens, so the row shows the name only
			items: this.plugin.settings.tileSets.map((tileSet, index) => ({
				name: tileSet.name || 'Untitled',
				render: (setting: Setting) => {
					setting
						.addExtraButton(button => button
							.setIcon('lucide-pen-line')
							.setTooltip('Edit')
							.onClick(() => {
								new TileSetModal(this.app, { ...tileSet }, (updatedTileSet) => {
									this.plugin.settings.tileSets[index] = updatedTileSet;
									void this.saveAndRefresh();
								}).open();
							}))
						.addExtraButton(button => button
							.setIcon('lucide-trash-2')
							.setTooltip('Delete')
							.onClick(() => {
								this.plugin.settings.tileSets.splice(index, 1);
								void this.saveAndRefresh();
							}));
				},
			})),
		}];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await super.setControlValue(key, value);
		if (key === 'mapTheme') this.plugin.refreshMapStyles();
	}

	/** Adding, removing or renaming a tile set changes the definitions themselves. */
	private async saveAndRefresh(): Promise<void> {
		await this.plugin.saveSettings();
		this.update();
	}
}

