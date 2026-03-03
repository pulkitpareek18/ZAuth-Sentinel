// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ZAuthAnchor {
    address public immutable owner;

    struct Anchor {
        bytes32 merkleRoot;
        uint256 timestamp;
        string batchId;
    }

    mapping(string => Anchor) public anchors;
    string[] public batchIds;

    event MerkleRootAnchored(
        string indexed batchId,
        bytes32 merkleRoot,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function anchor(string calldata batchId, bytes32 merkleRoot) external onlyOwner {
        require(anchors[batchId].timestamp == 0, "batch already anchored");

        anchors[batchId] = Anchor({
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            batchId: batchId
        });
        batchIds.push(batchId);

        emit MerkleRootAnchored(batchId, merkleRoot, block.timestamp);
    }

    function verify(string calldata batchId, bytes32 merkleRoot) external view returns (bool) {
        return anchors[batchId].merkleRoot == merkleRoot;
    }

    function totalAnchors() external view returns (uint256) {
        return batchIds.length;
    }
}
