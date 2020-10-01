function replaceAll(value: string, term: string, replacement: string): string {
    return value.split(term).join(replacement);
}

export { replaceAll };