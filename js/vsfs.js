// class Visualizer {
//     constructor() {
//         this.blockSize = 0; // Expressed in KiB
//         this.numberOfBlocks = 0;
//         this.nodes = [];
//     }

//     * getRandomColor() {
		
//         var letters = '0123456789ABCDEF';
//         while(true) {
//           var color = '#';
//           for (var i = 0; i < 6; i++ ) {
//               color += letters[Math.floor(Math.random() * 16)];
//           }
//           yield color;
          
//         }
//     }


class Surface {
    constructor(surface) {
        if(this.constructor == Surface) {
            throw new Error("Abstract classes cannot be instantiated.");
        }
        this.surface = surface;
    }
    // paint(parentSurface) {
    //     throw new Error("Method 'paint()' must be implemented.");
    // }
    // clear() {
    //     throw new Error("Method 'clear()' must be implemented.");
    // }
}

class Supernode extends Surface {
    constructor(surface, blockSize, systemName, implementor) {
        super(surface);
        this.blockSize = blockSize;
        this.systemName = systemName;
        this.implementor = implementor;
    }
    paint(parentSurface) {
        this.surface.removeClass("d-none");
        this.surface.find(".card-header").text("Supernode");
        let cardBody = this.surface.find(".card-body");
        let textBlock = this.surface.find(".textBlock").clone(true).removeClass("d-none");
        cardBody.append(textBlock.clone(true).attr("id", "blockSize").text("Block Size: " + this.blockSize + "KiB")); 
        cardBody.append(textBlock.clone(true).attr("id", "systemName").text("System: " + this.systemName));
        cardBody.append(textBlock.clone(true).attr("id", "implementor").text("Author: " + this.implementor));
        parentSurface.append(this.surface);
    }
    clear() {
        this.surface.remove();
    }
}

class Bitmap extends Surface {
    constructor(surface, size, name) {
        super(surface);
        // Initialize the bitmap to be completely free
        this.bitmap = new Array(size).fill(true);
        this.size = size;
        this.name = name;
    }
    paint(parentSurface) {
        this.surface.removeClass("d-none");
        this.surface.find(".card-header").text(this.name + " Bitmap");
        let cardBody = this.surface.find(".card-body");
        for(let i = 0; i < this.bitmap.length; i++) {
            var x = $("#templates .bitmap-free").clone(true).removeClass("d-none");
            cardBody.append(x);
        }
        parentSurface.append(this.surface);
    }
    clear() {
        this.surface.remove();
    }
    isFree(index) {
        if(index < this.bitmap.size) {
            return this.bitmap[index];
        }
        return false;
    }
}

class Inode extends Surface {
    constructor(surface, number, type, uid, rwx, size) {
        super(surface);
        this.number = number;
        this.type = type;
        this.uid = uid;
        this.rwx = rwx;
        this.size = size;
        this.blocks = 0;
        this.ctime = new Date().toLocaleString();
        this.links_count = 0;
        this.block_pointers = null;
    }
    paint(parentSurface) {
        this.surface.removeClass("d-none");
        this.surface.find(".card-header").text("Inode #" + this.number);
        let cardBody = this.surface.find(".card-body");
        cardBody.find(".inodeType").text("Type: " + this.type).removeClass("d-none");
        cardBody.find(".inodeUid").text("UID: " + this.uid).removeClass("d-none");
        cardBody.find(".inodeRwx").text("RWX: " + this.rwx).removeClass("d-none");
        cardBody.find(".inodeSize").text("Size: " + this.size + " bytes").removeClass("d-none");
        cardBody.find(".inodeBlocks").text("Blocks: " + this.blocks).removeClass("d-none");
        cardBody.find(".inodeCTime").text("CTime: " + this.ctime).removeClass("d-none");
        cardBody.find(".inodeLinksCount").text("Links Count: " + this.links_count).removeClass("d-none");
        cardBody.find(".inodeBlockPointers").text("Block Pointers: " + this.block_pointers).removeClass("d-none");

        parentSurface.append(this.surface);
    }
    clear() {
        this.surface.remove();
    }
}

class InodeBlock extends Surface {
    constructor(surface, numberOfInodes, inodesPerBlock, inodeSize) {
        super(surface);
        this.numberOfInodes = numberOfInodes;
        this.inodesPerBlock = inodesPerBlock;
        this.inodeSize = inodeSize;
        this.inodes = [];

        for(let i = 0; i < this.numberOfInodes; i++) {
            this.inodes.push(new Inode($(".inode").clone(true), i, null, null, null, null));
        }
    }
    paint(parentSurface) {
        // need to do work here!
        this.surface.removeClass("d-none");
        this.surface.find(".card-header").text("Inode Block");
        for(var name in this.inodes) {
            this.inodes[name].paint(parentSurface);
        }
    }
    clear() {
        for(var name in this.inodes) {
            this.inodes[name].clear();
        }
    }
}

class DataBlock extends Surface {
    constructor(surface, size) {
        super(surface);
        this.file = null;
        this.size = size;
    }
}

class File extends Surface{
    constructor(surface, name, size) {
        super(surface);
        this.name = name;
        this.size = size;
    }
}

class Visualizer {
    constructor() {
        this.objects = [];
        this.blockSize = 1; // KiB
        this.numberOfBlocks = 1;
        this.inodeSize = 256; // bits
    }

    paint(surface) {
        for(var name in this.objects) {
            this.objects[name].paint(surface);
        }
    }

    clear() {
        for(var name in this.objects) {
            this.objects[name].clear();
        }
        this.objects = [];
    }

    build(surface) {
        this.blockSize = Math.floor($("#blockSize").val());
        this.blockSizeBits = this.blockSize * 1024;
        this.numberOfBlocks = Math.floor($("#numberOfBlocks").val());
        this.numberOfInodeBlocks = Math.ceil(this.numberOfBlocks / (this.blockSizeBits / this.inodeSize));
        this.numberOfInodes = this.numberOfInodeBlocks * (this.blockSizeBits / this.inodeSize);
        this.inodesPerBlock = this.numberOfInodes / this.numberOfInodeBlocks;
        

        if(!this.validateEntry()) {
            this.build(surface);
        }
        this.clear();
        this.superNode = new Supernode($(".node").clone(true), this.blockSize, "VSFS", "Dakota Cookenmaster");
        this.inodeBitmap = new Bitmap($(".node").clone(true), this.numberOfInodes, "Inode");
        this.dataBitmap = new Bitmap($(".node").clone(true), this.numberOfBlocks, "Data");
        this.inodeBlock = new InodeBlock($(".node").clone(true), this.numberOfInodes, this.inodesPerBlock, this.inodeSize);
        this.objects.push(this.superNode, this.inodeBitmap, this.dataBitmap, this.inodeBlock);
        this.paint(surface);
    }

    validateEntry() {
        if(this.blockSize < 1) {
            this.blockSize = 1;
            alert("You have chosen a block size less than 1KiB. This value has been increased by the system.");
            $("#blockSize").val(this.blockSize);
            return false;
        }
        if(this.blockSize > 20) {
            this.blockSize = 20;
            alert("You have chosen a block size greater than 20KiB. This value has been reduced by the system.");
            $("#blockSize").val(this.blockSize);
            return false;
        }
        if(this.numberOfBlocks > 32) {
            this.numberOfBlocks = 32;
            alert("You have chosen total blocks in excess of 32. This value has been reduced by the system.");
            $("#numberOfBlocks").val(this.numberOfBlocks);
            return false;

        } else if (this.numberOfBlocks < 1) {
            this.numberOfBlocks = 1;
            alert("You have chosen total blocks below 1. This value has been increased by the system.");
            $("#numberOfBlocks").val(this.numberOfBlocks);
            return false;
        } else {
            return true;
        }
    }
}

// Execute the visualization 
let v = new Visualizer();

function visualize() {
    if(v.objects.length) {
        if(!confirm("Starting a new visualization will overwrite all previous content. Are you sure you want to continue?")) {
            return;
        }
    }
    v.build($("#mainContent"));
}