export type RepeatMode = 'off' | 'all' | 'one';

export class QueueNavigation {
  private history: string[] = [];
  private remaining: string[] = [];
  private known = new Set<string>();
  reset() {
    this.history = [];
    this.remaining = [];
    this.known.clear();
  }
  sync(ids: string[]) {
    this.history = this.history.filter(id => ids.includes(id));
    this.remaining = this.remaining.filter(id => ids.includes(id));
    ids.forEach(id => {
      if (!this.known.has(id)) this.remaining.push(id);
    });
    this.known = new Set(ids);
  }
  visit(current: string, next: string) {
    if (current !== next) this.history.push(current);
    this.remaining = this.remaining.filter(id => id !== current && id !== next);
  }
  previous(current: string, ids: string[], shuffle: boolean) {
    this.sync(ids);
    if (shuffle) {
      const previous = this.history.pop();
      if (previous && previous !== current && !this.remaining.includes(current))
        this.remaining.push(current);
      return previous;
    }
    return ids[ids.indexOf(current) - 1];
  }
  next(
    current: string,
    ids: string[],
    repeat: RepeatMode,
    shuffle: boolean,
    ended: boolean,
    random = Math.random,
  ) {
    this.sync(ids);
    if (ended && repeat === 'one') return current;
    if (!shuffle) return ids[ids.indexOf(current) + 1] ?? (repeat === 'all' ? ids[0] : undefined);
    this.remaining = this.remaining.filter(id => id !== current);
    if (!this.remaining.length && repeat === 'all')
      this.remaining = ids.filter(id => id !== current);
    if (!this.remaining.length) return repeat === 'all' ? current : undefined;
    return this.remaining[
      Math.min(this.remaining.length - 1, Math.floor(random() * this.remaining.length))
    ];
  }
}
