import React, { Component } from 'react';

import './App.css';

let node_path = window.require('path');
let fs = window.require('fs');

let ipc = window.require('electron').ipcRenderer;
const PRESETS = ['DATETIME_7', 'MILLISEC', 'FILE_CREATED_TIME']

const openFileDialog = () => {
    ipc.send('open-file-dialog')
};

const fileNameFilter = file => {
    // return file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.mp4');
    return true;
};

const predefinedPatterns = {
    'DATETIME_7': [
        /^B612咔叽_(.{4})(.{2})(.{2})_(.{2})(.{2})(.{2}).(.{3})$/,
        /^IMG_(.{4})(.{2})(.{2})_(.{2})(.{2})(.{2}).(.{3})$/,
        /^VID_(.{4})(.{2})(.{2})_(.{2})(.{2})(.{2}).(.{3})$/
    ],
    'MILLISEC': [
        /^(.{13}).(.{3})$/,
        /^mmexport(.{13}).(.{3})$/,
        /^wx_camera_(.{13}).(.{3})$/,
    ]
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state ={
            currentFolder: './',
            files: [],
            sourcePattern: '^.+$',
            isSourcePatternValid: true,
            targetPattern: '',
            preset: PRESETS[0]
        };
        this.getMatchedFiles = this.getMatchedFiles.bind(this);
        this.transform = this.transform.bind(this);
        this.rename = this.rename.bind(this);
        this.updateSourcePattern = this.updateSourcePattern.bind(this);
        this.updatePreset = this.updatePreset.bind(this);
        this.showTargetName = this.showTargetName.bind(this);
        this.fileRenderer = this.fileRenderer.bind(this);
    }

    updatePreset(e) {
        this.setState({preset: e.target.value});
    }

    showTargetName(file) {
        alert(this.transform(file));
    }

    fileRenderer(file, i) {
        return <div key={i} className="file" onClick={() => this.showTargetName(file)}>{file}</div>;
    }

    rename() {
        let matchedFiles = this.getMatchedFiles();
        if (confirm(`Are you sure to rename ${matchedFiles.length} files?`)) {
            matchedFiles.forEach(file => {
                let from = node_path.join(this.state.currentFolder, file),
                    to = node_path.join(this.state.currentFolder, this.transform(file));
                fs.renameSync(from, to);
                console.log('renaming', from, to);
            });
            this.reloadFiles(this.state.currentFolder);
        }
    }

    transform(sourceFile) {
        function to2Digts(number) {
            if (number < 10 && number >= 0) {
                return (number + 100 + '').substr(1, 2);
            }
            return number;
        }
        
        if (this.state.isSourcePatternValid) {
            let result = new RegExp(this.state.sourcePattern).exec(sourceFile);

            if (result) {

                if (this.state.preset == PRESETS[0]) {
                    let [orig, year, month, day, hour, min, sec, ext] = result;
                    // console.log(year, month, day, hour, min, sec);
                    return `${year}-${month}-${day} ${hour}.${min}.${sec}.${ext}`;
                } else if (this.state.preset == PRESETS[1]) {
                    var [orig, millis, ext] = result;
                    let date = new Date(+millis);
                    let year = date.getFullYear();
                    let month = to2Digts(date.getMonth() + 1);
                    let day = to2Digts(date.getDate());
                    let hour = to2Digts(date.getHours());
                    let min = to2Digts(date.getMinutes());
                    let sec = to2Digts(date.getSeconds());
                    return `${year}-${month}-${day} ${hour}.${min}.${sec}.${ext}`;
                } else if (this.state.preset == PRESETS[2]) {
                    var [orig, ext] = result;
                    let createdDate = fs.statSync(node_path.join(this.state.currentFolder,sourceFile)).birthtime;
                    let year = createdDate.getFullYear();
                    let month = to2Digts(createdDate.getMonth() + 1);
                    let day = to2Digts(createdDate.getDate());
                    let hour = to2Digts(createdDate.getHours());
                    let min = to2Digts(createdDate.getMinutes());
                    let sec = to2Digts(createdDate.getSeconds());
                    return `${year}-${month}-${day} ${hour}.${min}.${sec}.${ext}`;
                }
            }
        }

        return sourceFile;
    }

    getMatchedFiles() {
        return this.state.isSourcePatternValid ? 
            this.state.files.filter(file => new RegExp(this.state.sourcePattern).test(file)) :
            [];
    }

    renderSourceFileNames() {
        return this.getMatchedFiles().map(this.fileRenderer);
    }

    updateSourcePattern(event) {
        let sourcePattern = event.target.value;
        let isSourcePatternValid = false;
        try {
            new RegExp(sourcePattern);
            isSourcePatternValid = true;
        } catch (e) {}

        this.setState({
            sourcePattern,
            isSourcePatternValid
        });
    }

    reloadFiles(currentFolder) {
        let files = fs.readdirSync(currentFolder).toString().split(',').filter(fileNameFilter);

        this.setState({
            currentFolder, files
        });
    }
    
    componentDidMount() {
        ipc.on('selected-directory', (event, path) => {
            this.reloadFiles(path[0]);
        });
    }

    renderPresets() {
        return (
            <select value={this.state.preset} onChange={this.updatePreset}>
                {PRESETS.map((preset, idx) => <option key={idx} value={preset}>{preset}</option>)}
            </select>
        );
    }

    render() {
        let patternStyle = {
            border: this.state.isSourcePatternValid ? '':'2px solid red'
        }
        let matchedFiles = this.getMatchedFiles();

        return (
            <div className="App">
                <div className="header">
                    <div>
                        Current folder: {this.state.currentFolder} <button onClick={openFileDialog}>...</button>
                    </div>
                    <div>
                        Pattern: <input value={this.state.sourcePattern} onChange={this.updateSourcePattern} />
                    </div>
                    <div>
                        Presets: {this.renderPresets()}
                    </div>
                    <div className="matched-count">{matchedFiles.length} matched files</div>
                    <button onClick={this.rename}>Rename</button>
                </div>
                {matchedFiles.length > 0 && <section className="files-wrapper">
                    {this.renderSourceFileNames()}
                </section>}
            </div>
        );
    }
}

export default App;
