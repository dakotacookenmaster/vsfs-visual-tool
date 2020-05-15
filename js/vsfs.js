class Surface {
    constructor(surface) {
        if(this.constructor == Surface) {
            throw new Error("Abstract classes cannot be instantiated.");
        }
        this.surface = surface;
    }
    paint(parentSurface) {
        throw new Error("Method 'paint()' must be implemented.");
    }
    clear() {
        throw new Error("Method 'clear()' must be implemented.");
    }
}

class Superblock extends Surface {
    constructor(surface, blockSize, totalBlocks, inodeSize, totalInodes, inodeBlocks, systemName, implementor) {
        super(surface);
        this.blockSize = blockSize;
        this.totalBlocks = totalBlocks;
        this.inodeSize = inodeSize;
        this.totalInodes = totalInodes;
        this.inodeBlocks = inodeBlocks;
        this.systemName = systemName;
        this.implementor = implementor;
    }
    paint(parentSurface) {
        this.surface.removeClass("d-none");
        this.surface.find(".card-header").text("Superblock");
        let cardBody = this.surface.find(".card-body");
        let textBlock = this.surface.find(".textBlock").clone(true).removeClass("d-none");
        cardBody.append(textBlock.clone(true).attr("id", "blockSize").text("Block Size: " + this.blockSize + "KiB"));
        cardBody.append(textBlock.clone(true).attr("id", "totalBlocks").text("Data Blocks: " + this.totalBlocks));
        cardBody.append(textBlock.clone(true).attr("id", "inodeSize").text("Inode Size: " + this.inodeSize + " bytes"));
        cardBody.append(textBlock.clone(true).attr("id", "totalInodes").text("Inodes: " + this.totalInodes));
        cardBody.append(textBlock.clone(true).attr("id", "inodeBlocks").text("Inode Blocks: " + this.inodeBlocks));
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
        this.bitmapSurfaces = [];
        this.surface.removeClass("d-none");
        this.surface.find(".card-header").text(this.name + " Bitmap");
        let cardBody = this.surface.find(".card-body");
        for(let i = 0; i < this.bitmap.length; i++) {
            let x = $("#templates .bitmap-free").clone(true).removeClass("d-none");
            this.bitmapSurfaces.push(x);
            cardBody.append(x);
        }
        parentSurface.append(this.surface);
    }
    clear() {
        this.surface.remove();
    }
    makeFree(index, type) {
        let node;
        if(type == "data") {
            node = v.inodeBlock.inodes[index].block_pointers;
        } else {
            node = [index];
        }
        for(const pointer in node) {
            let index = node[pointer]
            if (index < this.bitmap.length) {
                this.bitmap[index] = true;
                this.bitmapSurfaces[index].removeClass("bitmap-used").addClass("bitmap-free");
            } else {
                return false;
            }
        }
        return true;
    }
    isFree(index) {
        if(index < this.bitmap.length) {
            return this.bitmap[index];
        }
        return false;
    }
    getFreeBlocks() {
        let total = [];
        for(let i = 0; i < this.bitmap.length; i++) {
            if(this.bitmap[i]) {
                total.push(i);
            }
        }
        return total;
    }
    link(index) {
        if(index < this.bitmap.length) {
            if(this.bitmap[index]) {
                this.bitmap[index] = false;
                this.bitmapSurfaces[index].removeClass("bitmap-free").addClass("bitmap-used");
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    allocateBlocks(number_of_blocks_to_allocate) {
        let freeBlocks = this.getFreeBlocks();
        let allocatedBlocks = [];
        if(freeBlocks.length >= number_of_blocks_to_allocate) {
            for(let i = 0; i < number_of_blocks_to_allocate; i++) {
                if(!this.link(freeBlocks[i])) {
                    alert("Failed to allocate block.")
                    allocatedBlocks = [];
                } else {
                    allocatedBlocks.push(freeBlocks[i]);
                }
            }
        } else {
            alert("There are fewer " + this.name.toLowerCase() + " blocks available than the requested allocation amount. The operation has been cancelled.");
        }
        return allocatedBlocks;
    }
}

class Inode extends Surface {
    constructor(surface, number, type, uid, rwx, size, parent) {
        super(surface);
        this.number = number;
        this.type = type;
        this.uid = uid;
        this.rwx = rwx;
        this.size = size;
        this.blocks = 0;
        this.ctime = null
        this.block_pointers = [];
        this.parent = parent;
    }
    paint(parentSurface) {
        this.inodeSurface = {};
        this.surface.removeClass("d-none").attr("id", "inode" + this.number);
        let cardHeader = this.surface.find(".card-header").text("Inode #" + this.number);
        let cardBody = this.surface.find(".card-body");
        this.inodeSurface["inodeType"] = cardBody.find(".inodeType").text("Type: " + this.type).removeClass("d-none");
        this.inodeSurface["inodeUid"] = cardBody.find(".inodeUid").text("UID: " + this.uid).removeClass("d-none");
        this.inodeSurface["inodeRwx"] = cardBody.find(".inodeRwx").text("RWXD: " + this.rwx).removeClass("d-none");
        this.inodeSurface["inodeSize"] = cardBody.find(".inodeSize").text("Size: " + this.size + " bytes").removeClass("d-none");
        this.inodeSurface["inodeBlocks"] = cardBody.find(".inodeBlocks").text("Blocks: " + this.blocks).removeClass("d-none");
        this.inodeSurface["inodeCTime"] = cardBody.find(".inodeCTime").text("CTime: " + this.ctime).removeClass("d-none");
        this.inodeSurface["inodeBlockPointers"] = cardBody.find(".inodeBlockPointers").removeClass("d-none").text("Block Pointers: ");

        if(this.number !== 0) {
            let trashcan = this.surface.find(".trashcan").removeClass("d-none").on("click", {number: this.number}, function (event) {
                let number = event.data.number;
                let type = v.inodeBlock.inodes[number].type;
                if (!v.inodeBitmap.isFree(number)) {
                    if (v.inodeBlock.unlink(number, type)) {
                        v.inodeBitmap.makeFree(number, "inode");
                        v.dataBitmap.makeFree(number, "data");
                        v.inodeBlock.inodes[number].block_pointers = [];
                    } else {
                        alert("You cannot unlink a directory with active pointers to blocks in memory. Free those blocks first.");
                    }
                } else {
                    alert("This inode is already free!");
                }
            });
            cardHeader.append(trashcan);
        }
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

        for (let i = 0; i < this.numberOfInodes; i++) {
            this.inodes.push(new Inode($("#templates .inode").clone(true), i, null, null, null, null, null));
        }
    }

    paint(parentSurface) {
        for (const name in this.inodes) {
            this.inodes[name].paint(parentSurface);
        }
    }

    clear() {
        for (const name in this.inodes) {
            this.inodes[name].clear();
        }
    }

    assignInode(index, type, uid, rwx, size, blocks, ctime, block_pointers, parent) {
        if (index < this.inodes.length) {
            let inode = this.inodes[index];
            inode.type = type;
            inode.uid = uid;
            inode.rwx = rwx;
            inode.size = size;
            inode.blocks = blocks;
            inode.ctime = ctime;
            inode.parent = parent;
            inode.block_pointers.concat(block_pointers);
            $(inode.inodeSurface["inodeType"]).text("Type: " + inode.type);
            $(inode.inodeSurface["inodeUid"]).text("UID: " + inode.uid);
            $(inode.inodeSurface["inodeRwx"]).text("RWXD: " + inode.rwx);
            if(type === "directory") {
                $(inode.inodeSurface["inodeSize"]).text("Size: " + inode.size + " bytes")
                    .append(" <i class=\"fas fa-info-circle\"></i> ").find("i").attr("title", "This assumes one byte per row in a directory's data table.");
            } else {
                $(inode.inodeSurface["inodeSize"]).text("Size: " + inode.size + " bytes")
                    .append(" <i class=\"fas fa-info-circle\"></i> ").find("i").attr("title", "This is the size of the file this inode refers to.");
            }
            $(inode.inodeSurface["inodeBlocks"]).text("Blocks: " + inode.blocks);
            $(inode.inodeSurface["inodeCTime"]).text("CTime: " + inode.ctime).append(" <i class=\"fas fa-info-circle\"></i>").find("i")
                .attr("title", "Milliseconds since the Epoch.");
            $(inode.inodeSurface["inodeBlockPointers"]).text("Block Pointers: ");

            inode = "#inode" + index;
            inode = $(inode).find(".card-body");
            inode.addClass("highlight");
            inode.one("webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend", function (event) {
                $(this).removeClass("highlight");
            });
        }
    }

    repaintBlockPointers(inode) {
        $(inode.inodeSurface["inodeBlockPointers"]).empty();
        for (let i = 0; i < inode.block_pointers.length; i++) {
            $(inode.inodeSurface["inodeBlockPointers"]).append("<a class='blockAnchor' id='inodeAnchor" + inode.block_pointers[i] + "' href='#data" + inode.block_pointers[i] + "'>" + inode.block_pointers[i] + "</a>");
            $(inode.inodeSurface["inodeBlockPointers"]).find("#inodeAnchor" + inode.block_pointers[i])
                .on("click", {bp: inode.block_pointers[i]}, function (event) {
                    let data = "#data" + event.data.bp;
                    data = $(data).find(".card-body");
                    data.addClass("highlight");
                    data.one("webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend", function (event) {
                        $(this).removeClass("highlight");
                    });
                });
        }
        // Handle smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();

                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
        $(inode.inodeSurface["inodeBlockPointers"]).prepend("Block Pointers: ");
    }

    addBlockPointer(index, pointer) {
        let inode = this.inodes[index];
        inode.block_pointers.push(pointer);
        inode.block_pointers = Array.from(new Set(inode.block_pointers));
        this.repaintBlockPointers(inode);
    }

    unlink(index, type) {
        if (index === 0) {
            alert("For the purposes of this visualization, deletion of the root node has been disabled.");
            return false;
        }
        let db = v.dataBlock.data[this.inodes[this.inodes[index].parent].block_pointers[0]].data;
        let pointers = this.inodes[index].block_pointers;
        if(type === "directory") {
            let block = v.dataBlock.data[pointers[0]].data;
            if (Object.keys(block).length > 2) {
                return false;
            }
        }
        let parent = this.inodes[index].parent;
        this.inodes[parent].size--;
        let size = this.inodes[parent].size;
        if(type === "directory") {
            $(this.inodes[parent].inodeSurface["inodeSize"]).text("Size: " + size + " bytes")
                .append(" <i class=\"fas fa-info-circle\"></i>").find("i").attr("title", "This assumes one byte per row in a directory's data table.");
        } else {
            $(this.inodes[parent].inodeSurface["inodeSize"]).text("Size: " + size + " bytes")
                .append(" <i class=\"fas fa-info-circle\"></i>").find("i").attr("title", "This is the size of the file this inode refers to.");
        }
        for (const name in pointers) {
            let i = pointers[name];
            if (type === "file") {
                v.dataBlock.data[i].dataSurface["textBlock"]
                    .append("<i title=\"This data block has been unlinked and can now be overwritten.\" " +
                        "class=\"deleted fas fa-trash-restore-alt\"></i>");
            } else {
                $(v.dataBlock.data[i].dataSurface["textBlock"]).find("td + td")
                    .append("<i title=\"This data block has been unlinked and can now be overwritten.\" class=\"deleted fas fa-trash-restore-alt\"></i>");
                $("#parent").find("option[value = "  + index + "]").remove();
            }
        }

        for(const name in db) {
            if(db[name] == index) {
                delete db[name];
            }
        }
        v.dataBlock.updateDataBlock(this.inodes[this.inodes[index].parent].block_pointers[0], "directory");
        let nodes = this.inodes[index].inodeSurface;
        for(const name in nodes) {
            $(this.inodes[index].inodeSurface[name]).append("<i title=\"This inode has been unlinked and can now be overwritten.\" " +
                "class=\"deleted fas fa-trash-restore-alt\"></i>");
        }
        return true;
    }
}

class Data extends Surface {
    constructor(surface, data, number) {
        super(surface)
        this.data = data;
        this.number = number;
    }
    paint(parentSurface) {
        this.dataSurface = {};
        this.surface.removeClass("d-none").attr("id", "data" + this.number);
        this.surface.find(".card-header").text("Data Block #" + this.number);
        let cardBody = this.surface.find(".card-body");
        this.dataSurface["textBlock"] = cardBody.find(".textBlock");

        parentSurface.append(this.surface);
    }
    clear() {
        this.surface.remove();
    }
}

class DataBlock extends Surface {
    constructor(surface, numberOfBlocks) {
        super(surface);
        this.numberOfBlocks = numberOfBlocks
        this.data = [];

        for(let i = 0; i < this.numberOfBlocks; i++) {
            this.data.push(new Data($("#templates .node").clone(true), {}, i));
        }
    }
    paint(parentSurface) {
        for(const name in this.data) {
            this.data[name].paint(parentSurface)
        }
    }
    clear() {
        for(const name in this.data) {
            this.data[name].clear()
        }
    }
    updateDataBlock(index, type) {
        let d = this.data[index];
        let dataSection = $(d.dataSurface["textBlock"]).removeClass("d-none");
        dataSection.empty();
        if(type === "directory") {
            dataSection.empty();
            dataSection.append("<table class='table'>" +
                "" +
                "<thead><tr><th>Name</th><th>Inode Number</th></tr></thead>" +
                "" +
                "</table>");
            dataSection = dataSection.find("table");
        }
        for(const attr in d.data) {
            if(type === "directory") {
                dataSection.append("<tr><td>" + attr + "</td><td><a class='blockAnchor' href='#inode" + d.data[attr] + "'>" + d.data[attr] + "</a></td></tr>");
                $(document).find("a[href='#inode" + d.data[attr] + "']")
                    .on("click", {block: d.data[attr]},function (event) {
                        $(document).find("#inode" + event.data.block + " .card-body")
                            .addClass("highlight")
                            .one("webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend", function (event) {
                                $(this).removeClass("highlight");
                            });
                        });
            } else {
                dataSection.append("<i class=\"fas fa-file\"></i> " + d.data[attr]);
            }
        }
    }

    assignData(index, data, type, overwrite = false) {
        if(index < this.data.length) {
            let d = this.data[index];
            if(!overwrite) {
                $.extend(d.data, data);
            }
            else {
                d.data = data;
            }
            this.updateDataBlock(index, type);
        }
    }
}

class Visualizer {
    constructor() {
        this.objects = [];
        this.blockSize = 1; // KiB
        this.numberOfBlocks = 1;
        this.built = false;
    }

    paint(surface) {
        for(const name in this.objects) {
            this.objects[name].paint(surface);
        }
        $("#name").removeAttr("disabled");
        $("#type").removeAttr("disabled");
        $("#parent").removeAttr("disabled");
        $("#fileSize").removeAttr("disabled");
        $("#newFile").removeAttr("disabled");
    }

    clear() {
        for(const name in this.objects) {
            this.objects[name].clear();
        }
        this.objects = [];
        $("#parent").empty();
    }

    updateDirectoryTree(child_id, child_name, is_root) {
        if(!is_root) {
            let parent_address = $(document).find("option[value='" + this.inodeBlock.inodes[child_id].parent + "']").text();
            let prefix = parent_address == "/" ? "" : "/";
            $("#parent").append("<option value=" + child_id + ">"+ parent_address + prefix + child_name +"</option>");
        } else {
            $("#parent").append("<option value=" + child_id + ">" + child_name + "</option>");
        }
    }

    checkCurrentDirectory(name, parent, type, is_root = false) {
        if(is_root) {
            return true;
        }
        let parentDataBlock = this.dataBlock.data[parent].data;
        if($.inArray(name, Object.keys(parentDataBlock)) !== -1) {
            alert("You already have a " + type + " named { " + name + " } in this directory. Please choose another name, or a different directory.");
            return false;
        }
        else if(name === "" || name === " ") {
            if(type === "directory") {
                alert("Directory names must not be empty");
                return false;
            } else {
                alert("File names must not be empty.");
                return false;
            }
        }
        else {
            return true;
        }

    }

    addDirectory(name, parent, is_root = false) {
        let inode;
        if(!this.checkCurrentDirectory(name, parent, "directory", is_root)) {
            return false;
        }
        let data = this.dataBitmap.allocateBlocks(1);
        if(data.length) {
            inode = this.inodeBitmap.allocateBlocks(1);
        } else {
            return false;
        }
        if (inode.length) {
            let rwx = is_root ? "rwx-" : "rwxd";
            let uid = is_root? "Sys" : "User";
            let inode_id = inode[0];
            let data_id = data[0];
            this.inodeBlock.assignInode(inode_id, "directory", uid, rwx, 2, 1, new Date().getTime(), [], parent);
            if(is_root) {
                this.dataBlock.assignData(data_id, {".": inode_id, "..": inode_id}, "directory", true);
                this.inodeBlock.addBlockPointer(inode_id, data_id);
                this.updateDirectoryTree(inode_id, name, is_root);
            }
            else {
                this.dataBlock.assignData(data_id, {".": inode_id, "..": parent}, "directory", true);
                this.dataBlock.assignData(parent, {[name] : inode_id}, "directory");
                this.inodeBlock.addBlockPointer(inode_id, data_id);
                this.updateDirectoryTree(inode_id, name, is_root);
                this.inodeBlock.inodes[parent].size++;
                let size = this.inodeBlock.inodes[parent].size;
                $(this.inodeBlock.inodes[parent].inodeSurface["inodeSize"]).text("Size: " + size + " bytes")
                    .append(" <i class=\"fas fa-info-circle\"></i>").find("i").attr("title", "This assumes one byte per row in a directory's inode table.");
            }
            return true;
        }
        return false;
    }

    addFile(name, parent, fileSize) {
        let inode = [];
        if(!this.checkCurrentDirectory(name, parent, "file")) {
            return false;
        }
        let required_blocks = Math.ceil(fileSize / this.blockSizeBytes);
        let data = this.dataBitmap.allocateBlocks(required_blocks);
        if(data.length) {
            inode = this.inodeBitmap.allocateBlocks(1);
        }
        if (inode.length) {
            let inode_id = inode[0];
            this.inodeBlock.assignInode(inode_id, "file", "User", "rwxd", fileSize, required_blocks, new Date().getTime(), data, parent);
            for (const index in data) {
                this.dataBlock.assignData(data[index], {"File Contents": name}, "file", true);
                this.inodeBlock.addBlockPointer(inode_id, data[index]);
            }
            let p = this.inodeBlock.inodes[parent].block_pointers[0];
            this.dataBlock.assignData(p, {[name]: inode_id}, "directory");
            this.inodeBlock.inodes[parent].size++;
            let size = this.inodeBlock.inodes[parent].size;
            $(this.inodeBlock.inodes[parent].inodeSurface["inodeSize"]).text("Size: " + size + " bytes")
                .append(" <i class=\"fas fa-info-circle\"></i>").find("i").attr("title", "This assumes one byte per row in a directory's inode table.");
            return true;
        } else {
            return false;
        }
    }

    build(surface) {
        this.built = false;
        this.blockSize = Math.floor($("#blockSize").val());
        this.blockSizeBytes = this.blockSize * 1024;
        this.numberOfBlocks = Math.floor($("#numberOfBlocks").val());
        this.inodeSize = Math.floor($("#inodeSize").val());
        this.numberOfInodeBlocks = Math.ceil(this.numberOfBlocks / (this.blockSizeBytes / this.inodeSize));
        this.numberOfInodes = this.numberOfInodeBlocks * (this.blockSizeBytes / this.inodeSize);
        this.inodesPerBlock = this.numberOfInodes / this.numberOfInodeBlocks;
        

        if(!this.validateEntry()) {
            this.build(surface);
        }
        this.clear();
        this.superBlock = new Superblock($("#templates .node").clone(true), this.blockSize, this.numberOfBlocks, this.inodeSize, this.numberOfInodes, this.numberOfInodeBlocks,"VSFS", "Dakota Cookenmaster");
        this.inodeBitmap = new Bitmap($("#templates .node").clone(true), this.numberOfInodes, "Inode");
        this.dataBitmap = new Bitmap($("#templates .node").clone(true), this.numberOfBlocks, "Data");
        this.inodeBlock = new InodeBlock($("#templates .node").clone(true), this.numberOfInodes, this.inodesPerBlock, this.inodeSize);
        this.dataBlock = new DataBlock($("#templates .node").clone(true), this.numberOfBlocks);
        this.objects.push(this.superBlock, this.inodeBitmap, this.dataBitmap, this.inodeBlock, this.dataBlock);
        this.paint(surface);
        this.built = true;
    }

    validateEntry() {
        if(this.blockSize < 1) {
            this.blockSize = 1;
            alert("You have chosen a block size less than 1KiB. This value has been increased by the system.");
            $("#blockSize").val(this.blockSize);
            return false;
        }
        else if(this.blockSize > 1024) {
            this.blockSize = 1000;
            alert("You have chosen a block size greater than 1024KiB (1MiB). This value has been reduced by the system.");
            $("#blockSize").val(this.blockSize);
            return false;
        }
        if(this.inodeSize < 1) {
            this.inodeSize = 1;
            alert("You have chosen an inode size less than one byte. This value has been increased by the system.")
            $("#inodeSize").val(this.inodeSize);
            return false;
        }
        else if(this.inodeSize > this.blockSizeBytes) {
            this.inodeSize = this.blockSizeBytes;
            alert("You have chosen an inode size greater than the block size. This value has been reduced by the system.");
            $("#inodeSize").val(this.inodeSize);
            return false;
        }
        if(this.numberOfBlocks > 1000) {
            this.numberOfBlocks = 1000;
            alert("You have chosen total blocks in excess of 1000. This value has been reduced by the system.");
            $("#numberOfBlocks").val(this.numberOfBlocks);
            return false;
        } 
        else if (this.numberOfBlocks < 1) {
            this.numberOfBlocks = 1;
            alert("You have chosen total blocks below 1. This value has been increased by the system.");
            $("#numberOfBlocks").val(this.numberOfBlocks);
            return false;
        }
        return true;
    }
}

// Execute the visualization 
let v = new Visualizer();

$("#visualizeForm").on("keydown", function(event) {
    if(event.key == "Enter") {
        event.preventDefault();
        $("#visualizeButton").trigger("click");
        $("#name").trigger("focus");
    }
});

$("#addForm").on("keydown",function(event) {
    if (event.key == "Enter") {
        event.preventDefault();
        $("#newFile").trigger("click");
        $("#name").trigger("focus");
        $("#name").val("");
    }
});

function visualize() {
    if(v.objects.length) {
        if(!confirm("Starting a new visualization will overwrite all previous content. Are you sure you want to continue?")) {
            return;
        }
    }
    v.build($("#mainContent"));
    // Initialize the root directory
    v.addDirectory("/", null, true);

    $("#type").on("change", function(event) {
        if(this.value === "directory") {
            $("#fs").css("display", "none");
            $("#newFile").text("Add Directory");
            $("#nameLabel").text("Directory Name");
            $("#nameSmall").text("Note: extensions are ignored, so a directory with an extension is treated no differently than a standard directory.")
        } else {
            $("#fs").css("display", "block");
            $("#newFile").text("Add File");
            $("#nameLabel").text("Filename");
            $("#nameSmall").text("e.g. visualize.txt (note: extensions are ignored.)");
        }
    })
}
function addFile() {
    if(v.built) {
        let name = $("#name").val();
        let type = $("#type").val();
        let parent = $("#parent").val();
        let fileSize = Math.ceil($("#fileSize").val());
        if(type === "file") {
            if(!v.addFile(name, parent, fileSize)) {
                alert("Creation of the requested file failed.");
                return false;
            }
            return true;
        }
        else {
            if(!v.addDirectory(name, parent)) {
                alert("Creation of the requested directory failed.");
                return false;
            }
            return true;
        }
    } else {
        alert("Start the visualization before trying to add a file or directory.");
        return false;
    }
}