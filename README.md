# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
<img width="1859" height="839" alt="MainDashboard" src="https://github.com/user-attachments/assets/fab2dbbe-d509-4393-9211-88b99bd3b342" />
<img width="1831" height="774" alt="CPU1" src="https://github.com/user-attachments/assets/19d7799f-b6ab-4fbe-99ba-11c281d16773" />
<img width="1856" height="833" alt="N1" src="https://github.com/user-attachments/assets/db6b67c8-22b1-4f50-aa3b-843b22ac1a30" />
<img width="1843" height="909" alt="M1" src="https://github.com/user-attachments/assets/3dc421db-e6b3-41c8-979e-eebb51f18174" />
<img width="1748" height="696" alt="M2" src="https://github.com/user-attachments/assets/642735ec-b229-49fd-8d0a-82345e53a808" />
<img width="1756" height="731" alt="G1" src="https://github.com/user-attachments/assets/64b2f81d-779f-4bfa-be98-79625d7ec8a7" />
<img width="1727" height="505" alt="G2" src="https://github.com/user-attachments/assets/2b69f94d-2a71-4306-85cb-7c272e08b514" />
<img width="1720" height="563" alt="N2" src="https://github.com/user-attachments/assets/e17a643a-c5fd-4981-97be-8e58f730ed24" />
<img width="1570" height="628" alt="CPU2" src="https://github.com/user-attachments/assets/e8f450f2-a4c1-49b0-832f-80925e62ab5c" />



## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
