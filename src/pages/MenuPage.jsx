import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Loader } from '../cmps/Loader'
import { CategoryFilter } from '../cmps/CategoryFilter'
import { ItemSearch } from '../cmps/ItemSearch'
import { ItemList } from '../cmps/ItemList'
import { PaginationButtons } from '../cmps/PaginationButtons'
import { loadItems, setFilterBy } from '../store/actions/item.actions'
import { showErrorMsg } from '../services/event-bus.service'
import { AppShell } from '../cmps/AppShell'

export function MenuPage() {
  const { t } = useTranslation()
  const items = useSelector((storeState) => storeState.itemModule.items)
  const filterBy = useSelector((storeState) => storeState.itemModule.filterBy)
  const maxPage = useSelector((storeState) => storeState.itemModule.maxPage)
  const isLoading = useSelector(
    (storeState) => storeState.itemModule.flag.isLoading
  )

  useEffect(() => {
    fetchItems()
  }, [filterBy])

  async function fetchItems() {
    try {
      await loadItems()
    } catch (error) {
      showErrorMsg(t('cannotLoadProducts'))
    }
  }

  function onSetFilter(newFilter) {
    setFilterBy({ ...filterBy, ...newFilter })
  }

  function onChangePageIdx(diff) {
    let newPageIdx = +filterBy.pageIdx + diff
    if (newPageIdx < 0) newPageIdx = maxPage - 1
    if (newPageIdx >= maxPage) newPageIdx = 0
    onSetFilter({ pageIdx: newPageIdx })
  }

  return (
    <AppShell
      title={t('products')}
      subtitle={`${items.length} ${t('itemsCount')}`}
      flush
    >
      {/* Categories and search share one bar, so the header stays a single row
          of controls instead of a tall search box above a separate chip row. */}
      <div className="catalog-bar">
        <CategoryFilter
          filterBy={filterBy}
          onSetFilter={onSetFilter}
          selectedCategoryId={filterBy.categoryId}
        />
        <ItemSearch filterBy={filterBy} onSetFilter={onSetFilter} />
      </div>
      {isLoading && <Loader />}
      {!isLoading && <ItemList items={items} />}
      {!!items.length && maxPage > 1 && (
        <PaginationButtons
          pageIdx={filterBy.pageIdx}
          onChangePageIdx={onChangePageIdx}
        />
      )}
    </AppShell>
  )
}
