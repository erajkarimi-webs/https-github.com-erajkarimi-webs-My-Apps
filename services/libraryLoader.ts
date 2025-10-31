/**
 * Waits for a global variable (library) to be available on the window object.
 * @param globalVarName The name of the global variable to wait for (e.g., 'Papa', 'jsPDF').
 * @param timeout The maximum time to wait in milliseconds.
 * @returns A promise that resolves with the library instance or rejects on timeout.
 */
export const waitForLibrary = <T>(globalVarName: string, timeout = 15000): Promise<T> => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkLibrary = () => {
            const library = (window as any)[globalVarName];
            if (library) {
                resolve(library as T);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Library '${globalVarName}' failed to load within ${timeout}ms. Please check your internet connection or try refreshing the page.`));
            } else {
                setTimeout(checkLibrary, 100); // Poll every 100ms
            }
        };
        checkLibrary();
    });
};
