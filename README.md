# Overview

I created this drawing application to strengthen my TypeScript skills and learn how to build an interactive browser application with the HTML5 Canvas API. My goal was to practice organizing application behavior into classes, handling user input, validating data, and testing logic that does not depend directly on the browser.

This software is a web-based drawing app that lets users draw on a canvas with a brush, erase parts of the drawing, fill areas with color, add shapes, place text, pick colors from the canvas, clear the canvas, undo and redo actions, save/load drawings in browser storage, and export the finished drawing as a PNG image.

The purpose of creating this software was to learn how canvas drawing tools work behind the scenes. I wanted to practice TypeScript classes, arrays for storing drawing actions and history, async browser storage features, error handling, and automated tests with Jest.

[Software Demo Video](http://youtube.link.goes.here)

# Development Environment

I used Visual Studio Code as my editor and Node.js with npm for package management and scripts. The application runs in the browser with Vite during development, and I also generated a browser-ready JavaScript bundle so the app can run through Live Server.

The main programming language used for the project is TypeScript. The application also uses HTML, CSS, and the HTML5 Canvas API. Jest is used for unit testing, and TSLint is configured to check TypeScript code style.

# Useful Websites

- [MDN Web Docs - Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vite Documentation](https://vitejs.dev/guide/)
