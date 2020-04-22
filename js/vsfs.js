// class MemoryBlock {
//     constructor(size, number, parentNode, nextBlock = null) {
//         this.size = size;
//         this.number = number;
//         this.nextBlock = nextBlock;
        
//         // // Add a new memory block to the DOM
//         // this.block = $("#memoryBlock").clone(true).toggleClass("d-none").attr('id', 'block' + number);
//         // this.block.children(".card-body").text("Data: " + this.content);
//         // this.block.children(".card-header").text(this.number);
//         // this.block.find(".connector").css("background", this.color);
//         // this.parentNode.append(this.block);
//     }
// }

// class Inode extends MemoryBlock {

// }

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
        let textBlock = $(".textBlock").clone(true).removeClass("d-none");
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
    constructor(surface, size) {
        super(surface);
        // Initialize the bitmap to be completely free
        this.bitmap = new Array(size).fill(true);
    }
    paint(parentSurface) {
        console.log("painting");
        this.surface.removeClass("d-none");
        this.surface.find(".card-header").text("Inode Bitmap");
        let cardBody = this.surface.find(".card-body");
        
        for(let i = 0; i < this.bitmap.length; i++) {
            cardBody.append($(".bitmap-free").clone(true).removeClass("d-none"));
        }
        parentSurface.append(this.surface);
    }
    clear() {
        console.log("removing from surface");
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
        this.number = number; // used to globally identify this inode
        this.type = type;
        this.uid = uid;
        this.rwx = rwx;
        this.size = size;
        this.blocks = 0;
        this.ctime = new Date().toLocaleString();
        this.links_count = 0;
        this.block_pointers = null;
    }
}

class InodeBlock extends Surface{
    constructor(surface, size) {
        super(surface);
        this.size = size;
        this.bitmap = new Bitmap(surface, size);
        this.inodes = [];

        for(let i = 0; i < this.size; i++) {
            this.inodes.push(new Inode(surface, i, "root", null, null, null, this.size));
        }
    }
    paint(parentSurface) {
        this.bitmap.paint(parentSurface);
        // for(var name in this.inodes) {
        //     this.inodes[name].paint(parentSurface);
        // }
    }
    clear() {
        this.bitmap.clear();
        // for(var name in this.inodes) {
        //     this.inodes[name].clear()
        // }
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
        this.blockSize = 1;
        this.numberOfBlocks = 1;
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
    }

    build(surface) {
        this.blockSize = Math.floor($("#blockSize").val());
        this.numberOfBlocks = Math.floor($("#numberOfBlocks").val());
        this.objects = [];

        this.clear();
        this.validateEntry();
        
        this.superNode = new Supernode($(".node").clone(true), this.blockSize, "VSFS", "Dakota Cookenmaster")
        this.inodeBlock = new InodeBlock($(".node").clone(true), this.blockSize);
        this.objects.push(this.superNode, this.inodeBlock);

        this.paint(surface);
    }

    validateEntry() {
        if(this.blockSize < 1) {
            this.blockSize = 1;
            alert("You have chosen a block size less than 1KiB. This value has been increased by the system.")
        }
        if(this.numberOfBlocks > 32) {
            this.numberOfBlocks = 32;
            alert("You have chosen total blocks in excess of 32. This value has been reduced by the system.")
        } else if (this.numberOfBlocks < 1) {
            this.numberOfBlocks = 1;
            alert("You have chosen total blocks below 1. This value has been increased by the system.");
        }
    }
}

// Execute the visualization 
let v = new Visualizer();

function visualize() {
    // if(v.objects.length) {
    //     if(!confirm("Starting a new visualization will erase all previous content. Are you sure you want to continue?")) {
    //         return;
    //     }
    // }
    v.build($("#mainContent"));
}