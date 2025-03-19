const PriorityQueue = require('../utils/PriorityQueue');

describe('PriorityQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new PriorityQueue();
  });

  test('should create an empty queue', () => {
    expect(queue.isEmpty()).toBe(true);
    expect(queue.peek()).toBeNull();
  });

  test('should enqueue and dequeue items based on priority', () => {
    queue.enqueue('Task 1', 10);
    queue.enqueue('Task 2', 20);
    queue.enqueue('Task 3', 5);

    expect(queue.isEmpty()).toBe(false);
    expect(queue.peek().element).toBe('Task 2');
    
    const highestPriority = queue.dequeue();
    expect(highestPriority.element).toBe('Task 2');
    expect(highestPriority.priority).toBe(20);
    
    const secondHighest = queue.dequeue();
    expect(secondHighest.element).toBe('Task 1');
    
    const lowestPriority = queue.dequeue();
    expect(lowestPriority.element).toBe('Task 3');
    
    expect(queue.isEmpty()).toBe(true);
  });

  test('should maintain heap property after operations', () => {
    queue.enqueue('Task 1', 10);
    queue.enqueue('Task 2', 20);
    queue.enqueue('Task 3', 30);
    queue.enqueue('Task 4', 25);
    queue.enqueue('Task 5', 5);
    
    expect(queue.dequeue().element).toBe('Task 3');
    expect(queue.dequeue().element).toBe('Task 4');
    
    queue.enqueue('Task 6', 35);
    expect(queue.dequeue().element).toBe('Task 6');
    expect(queue.dequeue().element).toBe('Task 2');
  });
});