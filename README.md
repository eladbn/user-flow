# User Process Visualization Tool

This web application is designed to create and display interactive, step-by-step visual guides for user processes. It allows administrators to create, edit, and manage process flows that users can view in both desktop and mobile formats.

## Features

### User Interface
- **Interactive Process Visualization**: View processes as step-by-step guides
- **Responsive Design**: Support for both desktop and mobile views
- **RTL Support**: Full right-to-left language support (primarily for Hebrew)
- **Flow Navigation**: Easily navigate between steps with next/previous buttons
- **Modern UI**: Clean, modern interface with smooth transitions

### Admin Panel
- **Flow Management**: Create, edit, and delete process flows
- **Step Management**: Add, edit, order, and remove steps within flows
- **Image Upload**: Support for different images for desktop and mobile views
- **Logo Customization**: Upload and manage organization logo
- **Live Preview**: See changes in real-time before publishing
- **Drag-and-Drop Ordering**: Easily reorder steps with drag-and-drop interface

## Project Structure

```
.
├── public/
│   ├── admin.html             # Admin panel interface
│   ├── index.html             # Landing page with flows list
│   ├── presentor.html         # Process visualization interface
│   ├── css/
│   │   ├── main.css           # Basic styles
│   │   ├── modern-admin.css   # Admin panel styles
│   │   ├── modern-ui.css      # User interface styles
│   │   └── rtl.css            # Right-to-left support
│   └── js/
│       ├── admin.js           # Admin panel functionality
│       ├── file-upload-handler.js  # Handles file uploads
│       ├── sortable.min.js    # Sortable library for drag-and-drop
│       └── viewer.js          # Process viewer functionality
├── package.json
└── server.js
```
## How to Install

 - git clone https://www.github.com/eladbn/user-flow.git

 - cd user-flow

 - npm init

 - npm install express

 - node .\server.js

## How to Use

### User View

1. **Landing Page**: 
   - Visit the main index.html page to see all available process flows
   - Select a flow to view its detailed steps

2. **Process Viewer**:
   - Navigate through steps using next/previous buttons or by clicking on step names
   - Toggle between desktop and mobile views
   - View detailed images and descriptions for each step

### Admin View

1. **Authentication**:
   - Access the admin panel via /admin.html
   - Default password: `adminadminadmin` (change this in a production environment)

2. **Creating a Flow**:
   - Click "Create New Flow" to start a new process
   - Add a name and description
   - Save to create the flow

3. **Managing Steps**:
   - Add steps using the "Add Step" button
   - Provide a title, description, and images for desktop and mobile views
   - Drag and drop to reorder steps
   - Edit or delete steps as needed

4. **Logo Management**:
   - Upload a custom logo in the settings section
   - The logo will appear in both admin and user interfaces

## Technical Details

### Libraries and Dependencies
- **Sortable.js**: For drag-and-drop functionality
- **Remix Icon**: For UI icons
- **Browser APIs**: File upload and preview functionality

### Browser Support
This application works best in modern browsers (Chrome, Firefox, Safari, Edge).

### Data Storage
The application is designed to work with a backend API that stores:
- Flow definitions (name, description, and steps)
- Images for each step
- Logo and configuration settings

## API Endpoints

The application interacts with the following API endpoints:

- `GET /api/flows` - Get list of all flows
- `GET /api/flows/:id` - Get details of a specific flow
- `POST /api/flows` - Create a new flow
- `PUT /api/flows/:id` - Update an existing flow
- `DELETE /api/flows/:id` - Delete a flow
- `POST /api/upload` - Upload images for steps
- `GET /api/settings/logo` - Get the current logo
- `POST /api/settings/logo` - Upload a new logo

## Installation and Setup

1. Clone the repository to your local machine or server
2. Implement the required API endpoints on your backend
3. Configure the server to serve the static files from the public directory
4. Access the application through your web browser

## Customization

The application can be easily customized by modifying the CSS files. The main customization points are:

- **Color Scheme**: Edit the CSS variables in the `:root` selector in each CSS file
- **Layout**: Adjust the layout by modifying the grid and flex settings in the CSS
- **Typography**: Change fonts and text styles in the CSS files

## Security Considerations

- The admin authentication is very basic and should be enhanced in a production environment
- Implement proper server-side validation for all uploads and API requests
- Consider adding rate limiting to prevent abuse of the API endpoints

## License

MIT License

Copyright (c) 2025 eladbn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.