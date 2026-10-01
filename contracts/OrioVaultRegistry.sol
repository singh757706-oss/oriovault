// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OrioVaultRegistry {
    struct FileRecord {
        address owner;
        string rootCid;
        string name;
        string mimeType;
        uint256 size;
        uint256 createdAt;
        bool active;
    }

    uint256 public nextId;
    mapping(uint256 => FileRecord) public files;
    mapping(address => uint256[]) private ownerFiles;

    event FileRegistered(uint256 indexed id, address indexed owner, string rootCid, string name);
    event FileDeleted(uint256 indexed id, address indexed owner);

    function registerFile(string calldata rootCid, string calldata name, string calldata mimeType, uint256 size)
        external returns (uint256 id) {
        id = nextId++;
        files[id] = FileRecord(msg.sender, rootCid, name, mimeType, size, block.timestamp, true);
        ownerFiles[msg.sender].push(id);
        emit FileRegistered(id, msg.sender, rootCid, name);
    }

    function deleteFile(uint256 id) external {
        FileRecord storage f = files[id];
        require(f.owner == msg.sender, 'Not owner');
        require(f.active, 'Already deleted');
        f.active = false;
        emit FileDeleted(id, msg.sender);
    }

    function getOwnerFiles(address owner) external view returns (uint256[] memory) {
        return ownerFiles[owner];
    }
}
