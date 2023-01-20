import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { ClassNames } from '@emotion/core';
import { debounce } from 'lodash';
import Plain from 'slate-plain-serializer';
import { lengths, fonts } from 'netlify-cms-ui-default';

import Monaco from "@monaco-editor/react";

import { editorStyleVars, EditorControlBar } from '../styles';
import Toolbar from './Toolbar';

function rawEditorStyles({ minimal }) {
  return `
  position: relative;
  overflow: hidden;
  overflow-x: auto;
  min-height: ${minimal ? 'auto' : lengths.richTextEditorMinHeight};
  font-family: ${fonts.mono};
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: 0;
  margin-top: -${editorStyleVars.stickyDistanceBottom};
  padding: 0px;
`;
}

const RawEditorContainer = styled.div`
  position: relative;
`;

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: this.props.value || '',
      value: Plain.deserialize(this.props.value || ''),
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !this.state.value.equals(nextState.value) ||
      nextProps.value !== Plain.serialize(nextState.value)
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({
        text: this.props.value,
        value: Plain.deserialize(this.props.value)
      });
    }
  }

  componentDidMount() {
    if (this.props.pendingFocus) {
      this.props.pendingFocus();
    }
  }

  handleChange = (text, _) => {
    const value = Plain.deserialize(text);
    if (!this.state.value.document.equals(value.document)) {
      this.handleDocumentChange(text);
    }
    this.setState({
      text,
      value
    });
  };

  /**
   * When the document value changes, serialize from Slate's AST back to plain
   * text (which is Markdown) and pass that up as the new value.
   */
  handleDocumentChange = debounce(text => {
    this.props.onChange(text);
  }, 150);

  handleToggleMode = () => {
    this.props.onMode('rich_text');
  };

  processRef = (ref, _) => {
    this.editor = ref;
  };

  render() {
    const { className, field, isShowModeToggle, t } = this.props;
    return (
      <RawEditorContainer>
        <EditorControlBar>
          <Toolbar
            onToggleMode={this.handleToggleMode}
            buttons={field.get('buttons')}
            disabled
            rawMode
            isShowModeToggle={isShowModeToggle}
            t={t}
          />
        </EditorControlBar>
        <ClassNames>
          {({ css, cx }) => (
            <Monaco
              className={cx(
                className,
                css`
                  ${rawEditorStyles({ minimal: field.get('minimal') })}
                `,
              )}
              theme="vs-dark"
              language="markdown"
              value={this.state.text}
              onMount={this.processRef}
              onChange={this.handleChange}
              options={{
                minimap: {
                  enabled: false
                }
              }}
            />
          )}
        </ClassNames>
      </RawEditorContainer>
    );
  }
}

RawEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  value: PropTypes.string,
  field: ImmutablePropTypes.map.isRequired,
  isShowModeToggle: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
};
