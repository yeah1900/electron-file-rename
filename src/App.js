import React, { Component } from 'react';
import {debounce} from 'lodash';

import './App.css';

let fs = window.require('fs');

let ipc = window.require('electron').ipcRenderer;

const openFileDialog = () => {
    ipc.send('open-file-dialog')
};

const fileNameFilter = file => {
    return file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.mp4');
};

const fileRenderer = function(file, i){
    return <div key={i}>{file}</div>;
};

class App extends Component {
    constructor(props) {
        super(props);
        this.state ={
            currentFolder: './',
            sourcePattern: '',
            targetPattern: ''
        };
        this.getMatchedFiles = this.getMatchedFiles.bind(this);
        this.transform = this.transform.bind(this);
        this.updateSourcePattern = this.updateSourcePattern.bind(this);
        this.updateTargetPattern = this.updateTargetPattern.bind(this);
    }

    transform(sourceFile) {
        return sourceFile.replace(new RegExp(this.state.sourcePattern), this.state.targetPattern);
    }

    getMatchedFiles() {
        return fs.readdirSync(this.state.currentFolder).toString().split(',')
                 .filter(fileNameFilter)
                 .filter(file => {
                     try {
                         return new RegExp(this.state.sourcePattern).test(file)
                     } catch (e) {
                         return false;
                     }
                 });
    }

    renderSourceFileNames() {
        return this.getMatchedFiles().map(fileRenderer);
    }

    renderTargetFileNames() {
        return this.getMatchedFiles().map(this.transform).map(fileRenderer);
    }

    updateSourcePattern(event) {
        this.setState({sourcePattern: event.target.value});
    }
    
    updateTargetPattern(event) {
        this.setState({targetPattern: event.target.value});
    }

    componentDidMount() {
        ipc.on('selected-directory', (event, path) => {
            this.setState({
                currentFolder: path[0]
            });
        });
    }

    render() {
        return (
            <div className="App">
                <div className="App-intro">
                    Current folder: <button onClick={openFileDialog}>{this.state.currentFolder}</button> 
                    <br/>
                    From pattern:&nbsp;&nbsp;<input value={this.state.sourcePattern} onChange={this.updateSourcePattern}/>
                    <br/>
                    To pattern:&nbsp;&nbsp;<input value={this.state.targetPattern} onChange={this.updateTargetPattern}/>
                    <br/>
                    <div style={{float:"left"}}>{this.renderSourceFileNames()}</div>
                    <div style={{float:"right"}}>{this.renderTargetFileNames()}</div>
                </div>
            </div>
        );
    }
}

export default App;
