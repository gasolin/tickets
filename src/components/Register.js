import Eth from 'ethjs';
import firebase from 'firebase';
import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { injectIntl } from 'react-intl'

import AlertHelper from './AlertHelper';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  GAS_PRICE,
  GAS_LIMIT,
  DEPOSIT
} from '../constants';

class Register extends Component {
  constructor (props) {
    super(props);

    this.state = {
      wallet: '',
      transaction: '',
      hadTicket: false,
      web3: true,
      name: '',
      email: '',
      initialized: false
    };
  }

  async componentDidMount () {
    const newState = {};
    // Initial with web3
    if (typeof window.web3 !== 'undefined') {
      let eth = new Eth(window.web3.currentProvider);
      const accounts = await eth.accounts();
      if (accounts.length > 0) {
        const wallet = accounts[0];
        const Ticket = eth.contract(CONTRACT_ABI);
        const ticket = Ticket.at(CONTRACT_ADDRESS);
        const result = await ticket.userId(wallet);
        const hadTicket = result[0] > 0;
        newState.wallet = wallet;
        newState.hadTicket = hadTicket;
      }
    } else {
      newState.web3 = false;
    }

    this.setState(newState)
  }

  onSend = async () => {
    let eth = new Eth(window.web3.currentProvider);
    const transaction = await eth.sendTransaction({
      from: this.state.wallet,
      to: CONTRACT_ADDRESS,
      value: Eth.toWei(DEPOSIT, 'ether'),
      gas: GAS_LIMIT,
      gasPrice: GAS_PRICE,
      data: '0x'
    });
    await firebase.database().ref(`users/${this.state.wallet}`).set({
      name: this.state.name,
      email: this.state.email,
      transaction
    });
    this.setState({transaction});
  }

  onNameChange = (event) => {
    this.setState({name: event.target.value});
  }

  onEmailChange = (event) => {
    this.setState({ email: event.target.value });
  }

  renderTransaction () {
    if (this.state.transaction) {
      return (<AlertHelper transaction={this.state.transaction} state="transaction-sent" />);
    }
  }

  renderError () {
    if (!this.state.web3) {
      return (<AlertHelper state="no-web3" />);
    } else if (this.state.initialized && !this.state.wallet) {
      return (<AlertHelper state="no-wallet" />);
    }
  }

  renderWarning () {
    if (this.state.hadTicket) {
      return (<AlertHelper state="had-ticket" />);
    }
  }

  render () {
    const intl = this.props.intl
    return (
      <div>
        <h2>
          {intl.formatMessage({ id: 'Register' })}
        </h2>
        <p>
          {intl.formatMessage({ id: 'registerDescription' }, { deposit: DEPOSIT })}
        </p>
        <Form className="w-50">
          <FormGroup>
            <Label for="name">{intl.formatMessage({ id: 'Name / Nickname' })}</Label>
            <Input type="text" name="name" id="name" value={this.state.name} onChange={this.onNameChange} />
          </FormGroup>
          <FormGroup>
            <Label for="email">{intl.formatMessage({ id: 'Email' })}</Label>
            <Input type="email" name="email" id="email" value={this.state.email} onChange={this.onEmailChange} />
          </FormGroup>
          <FormGroup>
            <Label for="wallet">{intl.formatMessage({ id: 'Wallet Address' })}</Label>
            <Input plaintext name="wallet" id="wallet">{this.state.wallet}</Input>
          </FormGroup>
        </Form>
        <Button disabled={this.state.hadTicket || !this.state.wallet} color="primary" onClick={this.onSend}>
          {intl.formatMessage({ id: 'Register With MetaMask' })}
        </Button>
        <div className="my-3">
          {this.renderError()}
          {this.renderWarning()}
          {this.renderTransaction()}
          haha
          <AlertHelper transaction={this.state.transaction} state="transaction-sent" />
          <AlertHelper state="no-web3" />
          <AlertHelper state="no-wallet" />
          <AlertHelper state="had-ticket" />
        </div>
      </div>
    );
  }
}

export default injectIntl(Register);
