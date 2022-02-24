// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { MessageEmbed, MessageActionRow, MessageButton, ColorResolvable } from 'discord.js';
import { Component, action } from 'libs/fluid';

const { DEFAULT_COLOR } = config;

export type PagedListItems = Array<string>;
export interface PagedListProps {
  //header: string;
  pageSize: number;
  page?: number;
  sections: { [key: string]: PagedListItems };
}

export interface PagedListState {
  page: number;
}

export default class PagedListComponent extends Component {
  declare props: PagedListProps;
  declare state: PagedListState;

  constructor(props: PagedListProps) {
    super(props);
    this.state.page = this.props.page ?? 0;
  }

  renderPages() {
    const getLength = (...items: Array<string>) => items.map(x => x.split('\n').length).reduce((a, b) => a + b);
    const pages: Array<MessageEmbed> = [];
    let last = 0;

    Object.entries(this.props.sections).map(([name, section]) => {
      const sectionSize = getLength(name, ...section);
      const headerSize = getLength(name);

      let written = 0;
      let itemPosition = 0;

      while (written < sectionSize) {
        // (headerSize + 1) is enough space to store the header plus at least
        // 1 line of the section's content.
        if (pages.length && last + written < pages.length * this.props.pageSize - (headerSize + 1)) {
          // There is still space left on the page so let's continue writing to it.
          // Calculate how much space is left and add the field to the page.
          written += headerSize;
          const items: Array<string> = [];

          for (; itemPosition < section.length; itemPosition++) {
            const item = section[itemPosition];
            const accumulation = [...items, item];
            const size = getLength(item);

            if (size > this.props.pageSize - headerSize) throw RangeError('Item too big to fit onto page');
            if (last + written + size >= pages.length * this.props.pageSize) break;
            if (accumulation.map(x => x.length).reduce((a, b) => a + b + 1) > 1023) break;

            // TODO: this will break if a section item's size is greater than a page's size
            // but let's just ignore it.
            items.push(item);
            written += size;
          }

          if (items.length) {
            pages.at(-1)?.addField(name, items.join('\n'));
          }
        } else {
          // If we run out of space in page the loop will cycle once to
          // just create the page, and then cycle again to continue writing.
          pages.push(new MessageEmbed().setColor(DEFAULT_COLOR as ColorResolvable));
        }
      }

      last += written;
    });

    return pages;
  }

  render() {
    const pages = this.renderPages();
    const page = pages[this.state.page].setFooter({ text: `Viewing page ${this.state.page + 1} of ${pages.length}` });
    // This is quite hacky and should be built into Fluid through setState().
    const changePage = (n: number) =>
      action(this, redirector => {
        const page = (n + pages.length) % pages.length;
        redirector(new PagedListComponent({ ...this.props, page }));
      });

    const components = [
      new MessageButton()
        .setLabel('First')
        .setStyle('SECONDARY')
        .setDisabled(this.state.page === 0)
        .setCustomId(changePage(0)),

      new MessageButton()
        .setLabel('Last')
        .setStyle('SECONDARY')
        .setDisabled(this.state.page === 0)
        .setCustomId(changePage(this.state.page - 1)),

      new MessageButton()
        .setLabel('Next')
        .setStyle('SECONDARY')
        .setDisabled(this.state.page + 1 >= pages.length)
        .setCustomId(changePage(this.state.page + 1)),

      new MessageButton()
        .setLabel('End')
        .setStyle('SECONDARY')
        .setDisabled(this.state.page + 1 >= pages.length)
        .setCustomId(changePage(pages.length))
    ];

    return {
      embeds: [page],
      components: [new MessageActionRow().addComponents(components)]
    };
  }
}
