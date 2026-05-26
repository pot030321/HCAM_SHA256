from app.core.config import BLOCK_SIZE
from app.services.hashing_service import calculate_sha256


def split_into_blocks(file_bytes: bytes, block_size: int = BLOCK_SIZE) -> list[bytes]:
    blocks = []
    start_index = 0

    while start_index < len(file_bytes):
        end_index = start_index + block_size
        block = file_bytes[start_index:end_index]
        blocks.append(block)
        start_index = end_index

    if len(blocks) == 0:
        blocks.append(b"")

    return blocks


def calculate_block_hashes(blocks: list[bytes]) -> list[str]:
    block_hashes = []

    for block in blocks:
        block_hash = calculate_sha256(block)
        block_hashes.append(block_hash)

    return block_hashes


def build_merkle_root(block_hashes: list[str]) -> str:
    if len(block_hashes) == 0:
        return calculate_sha256(b"")

    current_level = []
    for block_hash in block_hashes:
        current_level.append(block_hash)

    # Build upper levels until only the root remains.
    while len(current_level) > 1:
        next_level = []
        i = 0

        while i < len(current_level):
            left_hash = current_level[i]

            if i + 1 < len(current_level):
                right_hash = current_level[i + 1]
            else:
                # Duplicate the last hash when the number of hashes is odd.
                right_hash = left_hash

            combined_text = left_hash + right_hash
            combined_bytes = combined_text.encode("utf-8")
            parent_hash = calculate_sha256(combined_bytes)
            next_level.append(parent_hash)
            i = i + 2

        current_level = next_level

    return current_level[0]


def compare_block_hashes(old_hashes: list[str], new_hashes: list[str]) -> list[int]:
    changed_blocks = []
    longest_length = len(old_hashes)

    if len(new_hashes) > longest_length:
        longest_length = len(new_hashes)

    i = 0
    while i < longest_length:
        if i >= len(old_hashes):
            changed_blocks.append(i)
        elif i >= len(new_hashes):
            changed_blocks.append(i)
        elif old_hashes[i] != new_hashes[i]:
            changed_blocks.append(i)

        i = i + 1

    return changed_blocks
