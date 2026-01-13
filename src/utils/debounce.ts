export default function debounce<T extends (...args: any[]) => void>(fn: T, wait = 400) {
  let timer: number | null = null as any;
  function run(this: any, ...args: Parameters<T>) {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => fn.apply(this, args), wait);
  }
  run.cancel = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = null as any;
    }
  };
  return run as T & { cancel: () => void };
}
