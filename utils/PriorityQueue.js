class PriorityQueue {
    constructor() {
      this.heap = [];
    }

    getParentIndex(index) {
      return Math.floor((index - 1) / 2);
    }
  
    getLeftChildIndex(index) {
      return 2 * index + 1;
    }
  
    getRightChildIndex(index) {
      return 2 * index + 2;
    }

    hasParent(index) {
      return this.getParentIndex(index) >= 0;
    }

    hasLeftChild(index) {
      return this.getLeftChildIndex(index) < this.heap.length;
    }

    hasRightChild(index) {
      return this.getRightChildIndex(index) < this.heap.length;
    }

    parent(index) {
      return this.heap[this.getParentIndex(index)];
    }

    leftChild(index) {
      return this.heap[this.getLeftChildIndex(index)];
    }

    rightChild(index) {
      return this.heap[this.getRightChildIndex(index)];
    }

    swap(indexOne, indexTwo) {
      const temp = this.heap[indexOne];
      this.heap[indexOne] = this.heap[indexTwo];
      this.heap[indexTwo] = temp;
    }

    isEmpty() {
      return this.heap.length === 0;
    }

    peek() {
      if (this.isEmpty()) {
        return null;
      }
      return this.heap[0];
    }

    enqueue(element, priority) {
      this.heap.push({ element, priority });
      this.heapifyUp();
      return this;
    }

    dequeue() {
      if (this.isEmpty()) {
        return null;
      }
      
      const item = this.heap[0];
      const lastItem = this.heap.pop();
      
      if (this.heap.length > 0) {
        this.heap[0] = lastItem;
        this.heapifyDown();
      }
      
      return item;
    }

    heapifyUp() {
      let index = this.heap.length - 1;
      
      while (
        this.hasParent(index) && 
        this.parent(index).priority < this.heap[index].priority
      ) {
        const parentIndex = this.getParentIndex(index);
        this.swap(parentIndex, index);
        index = parentIndex;
      }
    }

    heapifyDown() {
      let index = 0;
      
      while (this.hasLeftChild(index)) {
        let largerChildIndex = this.getLeftChildIndex(index);
        
        if (
          this.hasRightChild(index) && 
          this.rightChild(index).priority > this.leftChild(index).priority
        ) {
          largerChildIndex = this.getRightChildIndex(index);
        }
        
        if (this.heap[index].priority >= this.heap[largerChildIndex].priority) {
          break;
        }
        
        this.swap(index, largerChildIndex);
        index = largerChildIndex;
      }
    }
  }
  
  module.exports = PriorityQueue;