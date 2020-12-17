function replaceAll(value: string, term: string, replacement: string): string {
    if (!value) {
        return null;
    }
    if (!term) {
        return value;
    }
    return value.split(term).join(replacement || '');
}

export { replaceAll };
