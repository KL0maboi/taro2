class RegionEditor {

    gameScene: GameScene;
    devModeScene: DevModeScene;
    devModeTools: DevModeTools;

    regions: PhaserRegion[];
	regionDrawGraphics: Phaser.GameObjects.Graphics;
	regionDrawStart: {x: number, y: number};
	regionTool: boolean;

	constructor (
        gameScene: GameScene, devModeScene: DevModeScene, devModeTools: DevModeTools
	) {
        this.gameScene = gameScene;
        this.devModeScene = devModeScene;
        this.devModeTools = devModeTools;
        this.regions = [];

        this.gameScene.input.on('pointerdown', (pointer) => {
			if (this.regionTool) {
				const worldPoint = this.gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
				this.regionDrawStart = {
					x: worldPoint.x,
					y: worldPoint.y,
				}
			}
		}, this);

		const graphics = this.regionDrawGraphics = this.gameScene.add.graphics();
		let width;
		let height;

		this.gameScene.input.on('pointermove', (pointer) => {
			if (!pointer.leftButtonDown()) return;
			else if (this.regionTool) {
				const worldPoint = this.gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
				width = worldPoint.x - this.regionDrawStart.x;
				height = worldPoint.y - this.regionDrawStart.y;
				graphics.clear();
				graphics.lineStyle(	2, 0x036ffc, 1);
				graphics.strokeRect( this.regionDrawStart.x, this.regionDrawStart.y , width, height);
				}
			}, this);

		this.gameScene.input.on('pointerup', (pointer) => {
			if (!pointer.leftButtonReleased()) return;
			const worldPoint = this.gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
			if (this.regionTool && this.regionDrawStart && this.regionDrawStart.x !== worldPoint.x && this.regionDrawStart.y !== worldPoint.y) {
				graphics.clear();
				this.regionTool = false;
				this.devModeTools.highlightModeButton(0);
				let x = this.regionDrawStart.x;
				let y = this.regionDrawStart.y;
				if (width < 0) {
					x = this.regionDrawStart.x + width;
					width *= -1;
				}
				if (height < 0) {
					y = this.regionDrawStart.y + height;
					height *= -1;
				}
				ige.network.send('editRegion', {x: Math.trunc(x), 
					y: Math.trunc(y), 
					width: Math.trunc(width), 
					height: Math.trunc(height)});

				this.regionDrawStart = null;
			}
		}, this);
	}

    edit (data: RegionData) {
        if (data.newName && data.name !== data.newName) {
            const region = ige.regionManager.getRegionById(data.name);
            if (region) region._stats.id = data.newName;
            this.devModeScene.regions.forEach(region => {
                if (region.name === data.name) {
                    region.name = data.newName;
                    region.updateLabel();
                }
            });
        }
        else if (data.showModal) {
            ige.addNewRegion && ige.addNewRegion({name: data.name, x: data.x, y: data.y, width: data.width, height: data.height, userId: data.userId});
        }

        ige.updateRegionInReact && ige.updateRegionInReact();
    }

    cancelDrawRegion() {
		if (this.regionTool) {
			this.regionDrawGraphics.clear();
			this.regionTool = false;
			this.devModeTools.highlightModeButton(0);
			this.regionDrawStart = null;
		}
	}

    showRegions() {
        this.devModeScene.regions.forEach(region => {
            region.show();
            region.label.visible = true;
        });
    }

    hideRegions() {
        this.devModeScene.regions.forEach(region => {
			if (region.devModeOnly) {
				region.hide();
			}
			region.label.visible = false;
		});
    }
}