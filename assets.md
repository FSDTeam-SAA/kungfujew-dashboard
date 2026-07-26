# Asset Dimensions & Placeholders

This document lists the recommended dimensions for image assets used in the application.

## Core Brand Assets

| Asset Name      | Filename   | Usage Location        | Dimensions (px) / Aspect Ratio | Notes                                            |
| :-------------- | :--------- | :-------------------- | :----------------------------- | :----------------------------------------------- |
| **Main Logo**   | `logo.png` | Navbar, Sidebar       | 150 x 150                      | Square aspect ratio recommended.                 |
| **Auth Logo**   | `logo.png` | Login, Register Pages | 120 x 120                      | Slightly smaller usage for authentication forms. |
| **Footer Logo** | `logo.png` | Footer                | 150 x 40                       | Rendered with customized aspect ratio in footer. |

## Feature & Marketing Images

| Section                    | Asset Filename                | Dimensions / Aspect Ratio    | Container sizing                                                                    |
| :------------------------- | :---------------------------- | :--------------------------- | :---------------------------------------------------------------------------------- |
| **Hero Section**           | `heroImage.png`               | ~1:1 (Square-ish)            | Container has `aspect-ratio: 12/11`. Responsive width.                              |
| **Adult Coloring Feature** | `heroImage.png`               | ~1.8:1 (Landscape)           | Used in Features list. Container `aspect-[1.8/1]`.                                  |
| **Kids Feature**           | `kids-playing.png`            | ~1.8:1 (Landscape)           | Container `aspect-[1.8/1]`.                                                         |
| **Pets Feature**           | `golden-retriever.png`        | ~1.8:1 (Landscape)           | Container `aspect-[1.8/1]`.                                                         |
| **Seniors Feature**        | `thoughtful-senior-woman.png` | ~1.8:1 (Landscape)           | Container `aspect-[1.8/1]`.                                                         |
| **Contact Page**           | `contact_woman_camera.png`    | Variable width, Fixed Height | Height: 400px (Mobile), 600px (Desktop). Width is responsive (w-full).              |
| **Gallery Items**          | _(Remote URLs)_               | Variable                     | Container height: 16rem (sm), 18rem (md), 20rem (lg), 24rem (xl). Width responsive. |

## Other Available Assets (Public Directory)

The following assets are present in `public/images` but specific dimensions were not strictly enforced or found in primary component scans:

- `car.jpg`
- `Group 1.svg`
- `logo.svg`
- `logo1.png`
- `no-image.jpg` (Placeholder)
- `4f8da1b70693c4fcf9e01b9293706aed5cd4e34d.jpg`

## Category & Style Pages

| Section            | Component        | Dimensions / Aspect Ratio | Notes                                                                |
| :----------------- | :--------------- | :------------------------ | :------------------------------------------------------------------- |
| **Styles Gallery** | `StylesPage.tsx` | 3:4 (Portrait)            | Grid items use `aspect-[3/4]`. Images object-cover.                  |
| **Category Cards** | `CategoryGrid`   | Variable                  | Check `CategoryGrid` usage (likely similar to styles or responsive). |

## Book Creation Workflow

| Step                   | Component               | Dimensions / Aspect Ratio | Notes                                                         |
| :--------------------- | :---------------------- | :------------------------ | :------------------------------------------------------------ |
| **Cover Preview**      | `CoverPageTestPage.tsx` | ~1:1 (Square-ish)         | Container height fixed `~604px`. Width responsive in grid.    |
| **Page Editor Canvas** | `ImageUploadPage.tsx`   | 1:1.414 (A4 Portrait)     | The main editing area simulates an A4 page.                   |
| **Upload Thumbnails**  | `ImageUploadPage.tsx`   | 1:1 (Square)              | Thumbnails for uploaded/converted images are `aspect-square`. |
| **Workflow Icons**     | `BookCreationFlow.tsx`  | N/A                       | Uses Lucide React icons, no static image assets.              |
